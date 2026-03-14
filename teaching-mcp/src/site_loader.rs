use std::path::{Path, PathBuf};

use regex::Regex;

#[derive(Debug, Clone, serde::Serialize)]
pub struct ChapterSummary {
    pub number: u8,
    pub title: String,
    pub path: PathBuf,
}

/// Scan site/src/pages/ for Chapter*.tsx and extract number + title.
pub async fn load_chapters(site_root: &Path) -> anyhow::Result<Vec<ChapterSummary>> {
    let pages_dir = site_root.join("src/pages");

    let mut entries: Vec<PathBuf> = Vec::new();
    let mut dir = tokio::fs::read_dir(&pages_dir).await?;
    while let Some(entry) = dir.next_entry().await? {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str.starts_with("Chapter") && name_str.ends_with(".tsx") {
            entries.push(entry.path());
        }
    }
    entries.sort();

    let chapter_num_re = Regex::new(r"Chapter(\d+)\.tsx$")?;
    let title_re = Regex::new(r"<motion\.h1[^>]*>\s*\n?\s*(.+)")?;

    let mut chapters = Vec::new();

    for path in entries {
        let filename = path.file_name().unwrap().to_string_lossy();

        let num: u8 = chapter_num_re
            .captures(&filename)
            .and_then(|c| c[1].parse().ok())
            .unwrap_or(0);

        if num == 0 {
            continue;
        }

        let content = tokio::fs::read_to_string(&path).await?;

        let title = title_re
            .captures(&content)
            .map(|c| c[1].trim().to_string())
            .unwrap_or_else(|| format!("Chapter {}", num));

        chapters.push(ChapterSummary {
            number: num,
            title,
            path,
        });
    }

    chapters.sort_by_key(|c| c.number);
    Ok(chapters)
}
