mod server;
mod site_loader;

use std::path::PathBuf;

use rmcp::{ServiceExt, transport::stdio};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Resolve site path: env var, or default to ../site relative to crate root.
    let site_root = std::env::var("SITE_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../site"));

    let site_root = site_root.canonicalize().map_err(|e| {
        anyhow::anyhow!("Cannot find site at {}: {}", site_root.display(), e)
    })?;

    eprintln!("teaching-mcp starting (site: {})", site_root.display());

    let server = server::TeachingServer::new(site_root).await?;

    let service = server
        .serve(stdio())
        .await
        .inspect_err(|e| eprintln!("serving error: {:?}", e))?;

    service.waiting().await?;
    Ok(())
}
