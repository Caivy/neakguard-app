//! Public placeholder for the NeakGuard Broker.
//!
//! The Broker and the Inspector are not open source. This crate has the same
//! interface that the NeakGuard App calls, so the App builds and runs from
//! this repository. It does not watch folders or examine Attachments.

/// The Broker interface that the NeakGuard App uses on Windows.
pub mod windows {
    use std::path::{Path, PathBuf};

    use anyhow::bail;
    use serde::{Deserialize, Serialize};

    const UNAVAILABLE: &str =
        "This build does not include the NeakGuard Broker. Install a NeakGuard release.";

    /// The current Watched Folder and Broker readiness.
    #[derive(Default, Serialize, Deserialize, PartialEq, Eq)]
    pub struct Status {
        /// The confirmed Watched Folder.
        pub folder: Option<PathBuf>,
        /// The Broker opened the Watched Folder and verified the Inspector sandbox.
        pub running: bool,
        /// A problem of the Broker itself.
        pub error: Option<String>,
        /// The Attachments in a Hold. Always empty in this build.
        #[serde(default)]
        pub held: Vec<HeldFile>,
    }

    /// One Attachment in a Hold, as the NeakGuard App lists it.
    #[derive(Serialize, Deserialize, PartialEq, Eq)]
    pub struct HeldFile {
        /// Where the Attachment is in the Watched Folder.
        pub path: PathBuf,
        /// The Attachment's file name.
        pub name: String,
        /// The version of the Attachment. Open Anyway applies to this version only.
        pub fingerprint: String,
    }

    /// One Attachment available for Restore.
    #[derive(Serialize)]
    pub struct Quarantined {
        /// The slot identifier.
        pub id: String,
        /// The original Attachment name.
        pub name: String,
    }

    /// Start the Broker. Always fails in this build.
    pub fn start(_state: &Path) -> anyhow::Result<()> {
        bail!(UNAVAILABLE)
    }

    /// Report that the Broker is not available.
    pub fn status(_state: &Path) -> anyhow::Result<Status> {
        Ok(Status {
            error: Some(UNAVAILABLE.to_owned()),
            ..Status::default()
        })
    }

    /// Confirm a Watched Folder. Always fails in this build.
    pub fn configure(_state: &Path, _path: &Path) -> anyhow::Result<()> {
        bail!(UNAVAILABLE)
    }

    /// List Quarantine slots. Always empty in this build.
    pub fn quarantined(_state: &Path) -> anyhow::Result<Vec<Quarantined>> {
        Ok(Vec::new())
    }

    /// Restore an Attachment. Always fails in this build.
    pub fn restore(_state: &Path, _id: &str) -> anyhow::Result<()> {
        bail!(UNAVAILABLE)
    }

    /// Record Open Anyway for a held Attachment. Always fails in this build.
    pub fn open_anyway_held(_state: &Path, _fingerprint: &str) -> anyhow::Result<()> {
        bail!(UNAVAILABLE)
    }

    /// Save the language of the NeakGuard App. Does nothing in this build.
    pub fn set_language(_state: &Path, _code: &str) -> anyhow::Result<()> {
        Ok(())
    }
}
