<script>
  import { onMount } from 'svelte'
  import { invoke, isTauri } from '@tauri-apps/api/core'
  import { downloadDir, join } from '@tauri-apps/api/path'
  import { open } from '@tauri-apps/plugin-dialog'
  import './design.css'
  import './app.css'
  import Icon from './Icon.svelte'
  import { canOpenAnyway, heldFilesOf, holdMessageKey } from './held.js'
  import en from './i18n/en.json'
  import km from './i18n/km.json'

  const savedFolderKey = 'neakguard.watchedFolder'
  let language = $state(localStorage.getItem('neakguard.language') === 'en' ? 'en' : 'km')
  let step = $state(0)
  let watchedFolder = $state(localStorage.getItem(savedFolderKey) ?? '')
  const supported = isTauri() && /Windows/.test(navigator.userAgent)
  let status = $state({})
  let quarantine = $state([])
  let busy = $state(false)
  let error = $state('')
  let refreshError = $state('')
  let page = $state(0)
  let detailsDialog = $state()
  let restoreDialog = $state()
  let restoreTarget = $state(null)
  let openAnywayDialog = $state()
  let openAnywayTarget = $state(null)
  let openRequested = $state({})
  let view = $state('held')
  let heldPage = $state(0)
  let detailText = $state('')
  const strings = $derived(language === 'km' ? km : en)
  const home = $derived(step === 4)
  const problem = $derived(error || refreshError || status.error || '')
  const protecting = $derived(Boolean(status.running) && !problem)
  const pageCount = $derived(Math.max(1, Math.ceil(quarantine.length / 4)))
  const currentPage = $derived(Math.min(page, pageCount - 1))
  const visibleAttachments = $derived(quarantine.slice(currentPage * 4, (currentPage + 1) * 4))
  // The Broker still holds these files while it reports an operational error, so keep them listed.
  const heldFiles = $derived(heldFilesOf(status))
  const heldPageCount = $derived(Math.max(1, Math.ceil(heldFiles.length / 3)))
  const currentHeldPage = $derived(Math.min(heldPage, heldPageCount - 1))
  const visibleHeld = $derived(heldFiles.slice(currentHeldPage * 3, (currentHeldPage + 1) * 3))
  const showing = $derived(heldFiles.length && (view === 'held' || !quarantine.length) ? 'held' : quarantine.length ? 'quarantine' : 'empty')
  const reasonText = (reason) => strings[`reason${reason}`] ?? strings.reasonFailed
  const heldStatus = (file) => strings[holdMessageKey(file)].replace('{reason}', reasonText(file.reason))
  const number = (value) => language === 'km' ? String(value).replace(/\d/g, (digit) => '០១២៣៤៥៦៧៨៩'[digit]) : String(value)
  const progress = (template, current, total) => template.replace('{current}', number(current)).replace('{total}', number(total))
  const displayFolder = (path) => path.replace(/^\\\\\?\\([a-z]:)/i, '$1')

  $effect(() => { document.documentElement.lang = language })

  onMount(() => {
    if (!watchedFolder && isTauri()) {
      downloadDir().then((folder) => join(folder, 'Telegram Desktop')).then((folder) => {
        if (!watchedFolder) watchedFolder = folder
      }).catch(() => { /* The native picker remains available when detection fails. */ })
    }
    if (!supported) return
    saveLanguage()
    initialize()
    const timer = setInterval(() => { if (home && !busy) refresh() }, 2500)
    return () => clearInterval(timer)
  })

  async function initialize() {
    await refresh()
    if (status.folder) {
      watchedFolder = displayFolder(status.folder)
      step = 4
      await startProtection()
    }
  }

  async function refresh() {
    try {
      status = await invoke('protection_status')
      quarantine = status.folder ? await invoke('list_quarantine') : []
      refreshError = ''
    } catch (cause) { refreshError = String(cause) }
  }

  function setLanguage(value) {
    language = value
    localStorage.setItem('neakguard.language', value)
    saveLanguage()
  }

  // The Broker shows its notifications in the language of the NeakGuard App. It cannot read
  // the web view storage, so the App hands the language over. A failure leaves the Broker on
  // English or on the language that it knew before.
  function saveLanguage() {
    if (supported) invoke('set_language', { language }).catch(() => {})
  }

  function showDetails(text) {
    detailText = text || strings.noDetails
    detailsDialog.showModal()
  }

  async function chooseFolder() {
    if (busy || !supported) return
    busy = true
    error = ''
    try {
      const selected = await open({ directory: true, multiple: false, title: strings.chooseFolder })
      if (selected !== null) watchedFolder = selected
    } catch (cause) { error = String(cause) }
    finally { busy = false }
  }

  async function configureFolder() {
    if (busy || !supported || !watchedFolder) return
    busy = true
    error = ''
    try {
      await invoke('configure_folder', { folder: watchedFolder })
      localStorage.removeItem(savedFolderKey)
      page = 0
      await refresh()
      watchedFolder = displayFolder(status.folder ?? watchedFolder)
      step = 4
    } catch (cause) { error = String(cause) }
    finally { busy = false }
  }

  async function startProtection() {
    if (busy || !supported) return
    busy = true
    error = ''
    try { await invoke('start_broker'); await refresh() }
    catch (cause) { error = String(cause) }
    finally { busy = false }
  }

  function confirmRestore(entry) {
    restoreTarget = entry
    restoreDialog.showModal()
  }

  function confirmOpenAnyway(file) {
    openAnywayTarget = file
    openAnywayDialog.showModal()
  }

  async function openAnyway() {
    if (busy || !openAnywayTarget) return
    const { fingerprint } = openAnywayTarget
    openAnywayDialog.close()
    busy = true
    error = ''
    try {
      await invoke('open_anyway', { fingerprint })
      openRequested = { ...openRequested, [fingerprint]: true }
      await refresh()
    } catch (cause) { error = String(cause) }
    finally { busy = false }
  }

  async function restoreAttachment() {
    if (busy || !restoreTarget) return
    const id = restoreTarget.id
    restoreDialog.close()
    busy = true
    error = ''
    try { await invoke('restore_attachment', { id }); await refresh() }
    catch (cause) { error = String(cause) }
    finally { busy = false }
  }
</script>

{#snippet tabs()}
  {#if heldFiles.length && quarantine.length}
    <div class="tabs" role="group" aria-label={strings.title}>
      <button class:on={showing === 'held'} aria-pressed={showing === 'held'} onclick={() => view = 'held'}>{strings.tabHeld} · {number(heldFiles.length)}</button>
      <button class:on={showing === 'quarantine'} aria-pressed={showing === 'quarantine'} onclick={() => view = 'quarantine'}>{strings.tabQuarantine} · {number(quarantine.length)}</button>
    </div>
  {/if}
{/snippet}

<main class="win">
  <aside class="guard">
    <div class="brand"><img src="/brand/neakguard-shield.svg" alt="" />NeakGuard</div>
    <div class="guard-body">
      {#if step === 2}
        <Icon name="telegram-folder" size={150} />
        <p class="state-sub">{strings.onlyFolder}</p>
      {:else}
        <div class="medal" class:on={home && protecting} class:off={home && !protecting} class:setup={!home}>
          <img src="/brand/neakguard-shield.svg" alt="" />
        </div>
        {#if home}
          <p class="state" aria-live="polite"><span class="dot" class:off={!protecting}></span>{protecting ? strings.protecting : strings.notProtecting}</p>
          {#if protecting}
            <div class="folder-chip"><Icon name="folder" size={22} /><div class="folder-info"><div class="t">{strings.watchingFolder}</div><div class="p">{watchedFolder}</div></div></div>
            <button class="link-btn" disabled={busy} onclick={() => { error = ''; step = 2 }}>{strings.changeFolder}</button>
          {:else}
            <p class="state-sub">{strings.stopped}</p>
            <button class="btn primary" disabled={busy || !supported} onclick={startProtection}>{busy ? strings.working : strings.restart}</button>
          {/if}
        {:else if step < 2}
          <p class="state-sub">{step === 0 ? strings.guardWelcome : strings.realExample}</p>
        {/if}
      {/if}
    </div>
    {#if step === 1 || home}<p class="guard-foot"><Icon name="info" size={16} />{home ? strings.defender : strings.antivirusNote}</p>{/if}
  </aside>
  <section class="work" aria-label={strings.title}>
    {#if step !== 0}
      <div class="topbar"><div class="lang" aria-label={strings.languageLabel}>
        <button class:on={language === 'km'} lang="km" aria-pressed={language === 'km'} onclick={() => setLanguage('km')}>ខ្មែរ</button>
        <button class:on={language === 'en'} lang="en" aria-pressed={language === 'en'} onclick={() => setLanguage('en')}>EN</button>
      </div></div>
    {/if}
    {#if (home && (!protecting || problem)) || (!home && error)}
      <div class="problem" role="alert"><b>{home ? strings.startError : strings.actionError}</b>{home ? strings.errorAdvice : strings.actionAdvice}<button class="link-btn details-link" onclick={() => showDetails(problem)}>{strings.details}</button></div>
    {/if}
    {#if step === 0}
      <div class="welcome-content">
        <h2>{strings.welcomeTitle}</h2><p class="lead intro-lead">{strings.welcomeText}</p>
        <div class="lang-pick" role="radiogroup" aria-label={strings.languageLabel}>
          {#each ['km', 'en'] as value}
            <label class="lang-card" class:on={language === value} lang={value}>
              <input type="radio" name="language" checked={language === value} onchange={() => setLanguage(value)} />
              <b>{value === 'km' ? 'ភាសាខ្មែរ' : 'English'}</b><small lang={value === 'km' ? 'en' : 'km'}>{value === 'km' ? 'Khmer' : 'អង់គ្លេស'}</small>
            </label>
          {/each}
        </div>
      </div>
      <div class="actions"><button class="btn primary" onclick={() => step = 1}>{strings.begin}</button></div>
    {:else if step === 1}
      <h2 class="lesson-title">{strings.lessonTitle}</h2>
      <div class="comic">
        <div class="panel"><p class="cap2"><b>{number(1)}</b>{strings.whatYouSee}</p>
          <div class="chat"><div class="fw">{strings.forwarded} <span>Service Notification</span></div><div class="file"><span class="dl"><Icon name="download" size={18} /></span><div><div class="fn">{strings.exampleName}.rar</div><div class="meta">1.9 MB</div></div></div></div>
          <p class="picture-caption">{strings.letterQuestion}</p>
        </div>
        <div class="go"><Icon name="arrow" size={24} /></div>
        <div class="panel inside-panel"><p class="cap2"><b>{number(2)}</b>{strings.whatsInside}</p>
          <div class="inside"><div class="bar"><Icon name="archive" size={12} />.rar</div><div class="row"><Icon name="program" size={20} /><div class="fn">{strings.exampleName}<em>.com</em></div></div></div>
          <p class="picture-caption danger-caption">{strings.programNotLetter}</p>
        </div>
      </div>
      <div class="verdict"><img src="/brand/neakguard-shield.svg" alt="" /><div><b>{strings.caught}</b><span>{strings.cannotOpen}</span></div></div>
      <div class="actions lesson-actions"><button class="btn primary" onclick={() => step = 2}>{strings.continue}</button><button class="btn quiet" onclick={() => step = 0}>{strings.back}</button></div>
    {:else if step === 2}
      <h2 class="folder-title">{strings.folderTitle}</h2>
      <p class="lead intro-lead">{watchedFolder ? strings.folderText : strings.folderMissing}</p>
      <div class="found"><span class="fi"><Icon name="folder" size={28} /></span><div>
        {#if watchedFolder}<span class="ok-tag">✓ {strings.found}</span><b>{strings.folderLabel}</b><code>{watchedFolder}</code>{:else}<b>{strings.folderMissing}</b>{/if}
      </div></div>
      <div class="actions">
        {#if watchedFolder}<button class="btn primary" disabled={busy} onclick={() => step = 3}>{strings.useFolder}</button>{/if}
        <button class="btn" class:primary={!watchedFolder} class:quiet={Boolean(watchedFolder)} disabled={busy || !supported} onclick={chooseFolder}>{busy ? strings.working : strings.chooseFolder}</button>
      </div>
      {#if !supported}<p class="platform-note">{strings.windowsOnly}</p>{/if}
      <button class="link-btn back-link" disabled={busy} onclick={() => step = 1}>{strings.back}</button>
    {:else if step === 3}
      <h2 class="ready-title">{strings.readyTitle}</h2><p class="lead intro-lead">{strings.remember}</p>
      <div class="found tip"><span class="fi"><Icon name="timer" size={28} /></span><div><b>{strings.waitTitle}</b><p>{strings.waitText}</p></div></div>
      <p class="platform-note">{strings.holdGap}</p>
      {#if !supported}<p class="platform-note">{strings.windowsOnly}</p>{/if}
      <div class="actions"><button class="btn primary" disabled={busy || !supported} onclick={configureFolder}>{busy ? strings.working : strings.start}</button><button class="btn quiet" disabled={busy} onclick={() => step = 2}>{strings.back}</button></div>
    {:else if showing === 'held'}
      {@render tabs()}
      <div class="list-head"><h2>{strings.holdTitle}</h2><span class="count held-count">{number(heldFiles.length)}</span></div>
      <p class="list-sub">{strings.holdText}</p>
      <ul class="items">
        {#each visibleHeld as file (file.path + file.fingerprint)}
          <li class="item"><span class="fic held"><Icon name={file.state === 'unprotected' ? 'info' : 'timer'} size={22} /></span><div class="attachment"><div class="n" title={file.name}>{file.name}</div><div class="w">{heldStatus(file)}</div>{#if file.detail}<button class="link-btn" onclick={() => showDetails(file.detail)}>{strings.details}</button>{/if}</div>
            {#if canOpenAnyway(file)}
              {#if openRequested[file.fingerprint]}<span class="w">{strings.holdOpening}</span>{:else}<button class="btn danger" disabled={busy} onclick={() => confirmOpenAnyway(file)}>{strings.openAnyway}</button>{/if}
            {/if}
          </li>
        {/each}
      </ul>
      <p class="platform-note">{strings.holdGap}</p>
      <nav class="pager" aria-label={strings.holdTitle}><span>{progress(strings.page, currentHeldPage + 1, heldPageCount)}</span><div class="pb"><button disabled={currentHeldPage === 0} onclick={() => heldPage = currentHeldPage - 1}>{strings.previous}</button><button disabled={currentHeldPage === heldPageCount - 1} onclick={() => heldPage = currentHeldPage + 1}>{strings.nextPage}</button></div></nav>
    {:else if showing === 'quarantine'}
      {@render tabs()}
      <div class="list-head"><h2>{strings.quarantine}</h2><span class="count">{number(quarantine.length)}</span></div>
      <p class="list-sub">{protecting ? strings.quarantineText : strings.quarantineStopped}</p>
      <ul class="items">
        {#each visibleAttachments as entry (entry.id)}
          <li class="item"><span class="fic"><Icon name="file" size={22} /></span><div class="attachment"><div class="n" title={entry.name}>{entry.name}</div><div class="w">{strings.suspicious}</div></div><button class="btn danger" disabled={busy} onclick={() => confirmRestore(entry)}>{strings.restore}</button></li>
        {/each}
      </ul>
      <nav class="pager" aria-label={strings.quarantine}><span>{progress(strings.page, currentPage + 1, pageCount)}</span><div class="pb"><button disabled={currentPage === 0} onclick={() => page = currentPage - 1}>{strings.previous}</button><button disabled={currentPage === pageCount - 1} onclick={() => page = currentPage + 1}>{strings.nextPage}</button></div></nav>
    {:else}
      <div class="empty"><Icon name="shield" size={64} /><h2>{strings.emptyTitle}</h2><p class="lead">{protecting ? strings.emptyText : strings.emptyStopped}</p><p class="platform-note">{strings.holdGap}</p></div>
    {/if}
    {#if !home}<div class="steps" aria-label={progress(strings.step, step + 1, 4)}>{#each [0, 1, 2, 3] as index}<i class:done={index < step} class:now={index === step}></i>{/each}<span>{progress(strings.step, step + 1, 4)}</span></div>{/if}
  </section>
</main>

<dialog class="dialog" bind:this={restoreDialog} aria-labelledby="restore-title" aria-describedby="restore-body">
  <h3 id="restore-title">{strings.restoreTitle}</h3><div class="fname">{restoreTarget?.name}</div><p id="restore-body">{strings.restoreText}</p>
  <div class="actions">
    <button class="btn danger" onclick={restoreAttachment}>{strings.restore}</button>
    <!-- svelte-ignore a11y_autofocus (A modal dialog must focus its safe default action.) -->
    <button class="btn primary" autofocus onclick={() => restoreDialog.close()}>{strings.keep}</button>
  </div>
</dialog>
<dialog class="dialog" bind:this={openAnywayDialog} aria-labelledby="open-anyway-title" aria-describedby="open-anyway-body">
  <h3 id="open-anyway-title">{strings.openAnywayTitle}</h3><div class="fname">{openAnywayTarget?.name}</div><p id="open-anyway-body">{strings.openAnywayText}</p>
  <div class="actions">
    <button class="btn danger" onclick={openAnyway}>{strings.openAnyway}</button>
    <!-- svelte-ignore a11y_autofocus (A modal dialog must focus its safe default action.) -->
    <button class="btn primary" autofocus onclick={() => openAnywayDialog.close()}>{strings.keepHeld}</button>
  </div>
</dialog>
<dialog class="dialog" bind:this={detailsDialog} aria-labelledby="details-title"><h3 id="details-title">{strings.details}</h3><p class="raw-details">{detailText}</p><div class="actions"><button class="btn quiet" onclick={() => detailsDialog.close()}>{strings.close}</button></div></dialog>
