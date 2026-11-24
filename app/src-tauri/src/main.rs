//! Entry point for the NeakGuard App.

#![cfg_attr(all(windows, not(debug_assertions)), windows_subsystem = "windows")]

fn main() {
    let app = tauri::Builder::default().plugin(tauri_plugin_dialog::init());
    #[cfg(windows)]
    let app = app.invoke_handler(tauri::generate_handler![
        protection_status,
        start_broker,
        configure_folder,
        list_quarantine,
        restore_attachment,
        open_anyway,
        set_language
    ]);
    app.run(tauri::generate_context!())
        .expect("NeakGuard App could not start");
}

#[cfg(windows)]
use neakguard_broker::windows as broker;

#[cfg(windows)]
fn state(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    use tauri::Manager;
    app.path()
        .app_local_data_dir()
        .map_err(|error| error.to_string())
}

#[cfg(windows)]
#[tauri::command]
async fn start_broker(app: tauri::AppHandle) -> Result<(), String> {
    broker::start(&state(&app)?).map_err(|error| format!("{error:#}"))
}

#[cfg(windows)]
#[tauri::command]
async fn protection_status(app: tauri::AppHandle) -> Result<broker::Status, String> {
    broker::status(&state(&app)?).map_err(|error| format!("{error:#}"))
}

#[cfg(windows)]
#[tauri::command]
async fn configure_folder(app: tauri::AppHandle, folder: String) -> Result<(), String> {
    broker::configure(&state(&app)?, std::path::Path::new(&folder))
        .map_err(|error| format!("{error:#}"))
}

#[cfg(windows)]
#[tauri::command]
async fn list_quarantine(app: tauri::AppHandle) -> Result<Vec<broker::Quarantined>, String> {
    broker::quarantined(&state(&app)?).map_err(|error| format!("{error:#}"))
}

#[cfg(windows)]
#[tauri::command]
async fn restore_attachment(app: tauri::AppHandle, id: String) -> Result<(), String> {
    broker::restore(&state(&app)?, &id).map_err(|error| format!("{error:#}"))
}

/// Record the user's Open Anyway decision for one held Uninspected Attachment version.
#[cfg(windows)]
#[tauri::command]
async fn open_anyway(app: tauri::AppHandle, fingerprint: String) -> Result<(), String> {
    broker::open_anyway_held(&state(&app)?, &fingerprint).map_err(|error| format!("{error:#}"))
}

/// Tell the Broker the language of the NeakGuard App (`en` or `km`), so that its notifications
/// use the same language.
#[cfg(windows)]
#[tauri::command]
async fn set_language(app: tauri::AppHandle, language: String) -> Result<(), String> {
    broker::set_language(&state(&app)?, &language).map_err(|error| format!("{error:#}"))
}
