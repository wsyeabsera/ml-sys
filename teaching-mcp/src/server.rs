use std::path::PathBuf;

use rmcp::{
    ErrorData as McpError, RoleServer, ServerHandler,
    model::*,
    service::RequestContext,
};

use crate::site_loader::ChapterSummary;

/// In-memory curriculum index, built at startup from the site files.
pub struct CurriculumIndex {
    pub chapters: Vec<ChapterSummary>,
}

pub struct TeachingServer {
    index: CurriculumIndex,
}

impl TeachingServer {
    pub async fn new(site_root: PathBuf) -> anyhow::Result<Self> {
        let chapters = crate::site_loader::load_chapters(&site_root).await?;
        eprintln!("Loaded {} chapters from {}", chapters.len(), site_root.display());
        Ok(Self {
            index: CurriculumIndex { chapters },
        })
    }
}

impl ServerHandler for TeachingServer {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: ProtocolVersion::default(),
            capabilities: ServerCapabilities::builder()
                .enable_resources()
                .build(),
            server_info: Implementation {
                name: "teaching-mcp".into(),
                title: None,
                version: env!("CARGO_PKG_VERSION").into(),
                description: None,
                icons: None,
                website_url: None,
            },
            instructions: Some(
                "Teaching MCP for the ml-sys learning project. \
                 Exposes curriculum content (chapters, viz, concepts) \
                 from the React site and rs-tensor codebase."
                    .to_string(),
            ),
        }
    }

    async fn list_resources(
        &self,
        _request: Option<PaginatedRequestParams>,
        _context: RequestContext<RoleServer>,
    ) -> Result<ListResourcesResult, McpError> {
        let mut resources = vec![RawResource {
            uri: "curriculum://chapters".into(),
            name: "Chapter List".into(),
            title: Some("All chapters in the learning curriculum".into()),
            description: Some(format!(
                "{} chapters covering tensors through transformers",
                self.index.chapters.len()
            )),
            mime_type: Some("application/json".into()),
            size: None,
            icons: None,
            meta: None,
        }
        .no_annotation()];

        // Each chapter is also individually addressable (Phase 2 will add content)
        for ch in &self.index.chapters {
            resources.push(
                RawResource {
                    uri: format!("curriculum://chapter/{}", ch.number),
                    name: format!("Chapter {}: {}", ch.number, ch.title),
                    title: None,
                    description: Some(format!("Chapter {} content", ch.number)),
                    mime_type: Some("text/plain".into()),
                    size: None,
                    icons: None,
                    meta: None,
                }
                .no_annotation(),
            );
        }

        Ok(ListResourcesResult::with_all_items(resources))
    }

    async fn read_resource(
        &self,
        request: ReadResourceRequestParams,
        _context: RequestContext<RoleServer>,
    ) -> Result<ReadResourceResult, McpError> {
        let uri = &request.uri;

        if uri.as_str() == "curriculum://chapters" {
            let listing: Vec<serde_json::Value> = self
                .index
                .chapters
                .iter()
                .map(|ch| {
                    serde_json::json!({
                        "number": ch.number,
                        "title": ch.title,
                    })
                })
                .collect();

            return Ok(ReadResourceResult {
                contents: vec![ResourceContents::text(
                    serde_json::to_string_pretty(&listing).unwrap(),
                    uri.as_str(),
                )],
            });
        }

        if let Some(num_str) = uri.as_str().strip_prefix("curriculum://chapter/") {
            let num: u8 = num_str.parse().map_err(|_| {
                McpError::invalid_params(format!("Invalid chapter number: '{}'", num_str), None)
            })?;

            let chapter = self.index.chapters.iter().find(|c| c.number == num).ok_or_else(|| {
                McpError::invalid_params(format!("Chapter {} not found", num), None)
            })?;

            // Phase 1: return title only. Phase 2 will add extracted text.
            let content = format!("# Chapter {}: {}\n\n(Full text extraction coming in Phase 2)", chapter.number, chapter.title);

            return Ok(ReadResourceResult {
                contents: vec![ResourceContents::text(content, uri.as_str())],
            });
        }

        Err(McpError::invalid_params(
            format!("Unknown resource URI: '{}'", uri),
            None,
        ))
    }
}
