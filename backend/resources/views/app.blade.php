<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,700;1,900&display=swap" rel="stylesheet">
    <title>Waiting List Puskesmas Sekemala</title>
    @php
      $manifestPath = public_path('assets/manifest.json');
      $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : [];
      $entry = $manifest['index.html'] ?? null;
    @endphp
    @if ($entry)
      @foreach ($entry['css'] ?? [] as $css)
        <link rel="stylesheet" crossorigin href="{{ asset($css) }}">
      @endforeach
      <script type="module" crossorigin src="{{ asset($entry['file']) }}"></script>
    @endif
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
