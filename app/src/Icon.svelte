<script>
  let { name, size = 24 } = $props()
</script>

{#if name === 'telegram-folder'}
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M6 18a4 4 0 014-4h14l5 5h25a4 4 0 014 4v27a4 4 0 01-4 4H10a4 4 0 01-4-4z" fill="#0d1f45" stroke="#ffbc00" stroke-width="2"/><circle cx="32" cy="36" r="9" fill="#229ED9"/><path d="M27.5 35.6l8.6-3.4c.5-.2.9.1.8.7l-1.5 7c-.1.5-.5.6-.9.4l-2.4-1.8-1.2 1.1c-.1.1-.3.2-.5.2l.2-2.4 4.3-3.9c.2-.2 0-.3-.3-.1l-5.3 3.3-2.3-.7c-.5-.2-.5-.5.1-.7z" fill="#fff"/></svg>
{:else}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
    {#if name === 'folder'}<path d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    {:else if name === 'info'}<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/>
    {:else if name === 'timer'}<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>
    {:else if name === 'file'}<path d="M6 2h9l5 5v15H6zM15 2v5h5M10 13l4 4M14 13l-4 4"/>
    {:else if name === 'shield'}<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5" stroke="#1d6b45"/>
    {:else if name === 'download'}<path d="M12 4v13M6 12l6 6 6-6"/>
    {:else if name === 'arrow'}<path d="M5 12h14M13 6l6 6-6 6"/>
    {:else if name === 'archive'}<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M10 3v4h4V3"/>
    {:else if name === 'program'}<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18"/>{/if}
  </svg>
{/if}
