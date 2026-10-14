<!--
  v1 tidak punya tab Ringkasan — tab pertama adalah Kronologi Harian.
  Rute / hanya mengalihkan ke /kronologi (meta refresh bekerja tanpa JS,
  sehingga aman untuk adapter-static/prerender).
-->
<script lang="ts">
  import { base } from '$app/paths';
</script>

<svelte:head>
  <meta http-equiv="refresh" content={`0; url=${base}/kronologi`} />
  <title>Mengalihkan… • StrategiHub 2026</title>
</svelte:head>

<div class="grid min-h-[60vh] place-items-center">
  <p class="text-[13.5px] text-ink-2">
    Mengalihkan ke <a href={`${base}/kronologi`} class="font-bold text-accent underline">Kronologi Harian</a>…
  </p>
</div>
