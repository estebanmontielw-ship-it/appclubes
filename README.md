<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>LNB Masculino 2026 — Sistema de flyers</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="tokens.css" />
  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
  <style>html, body { background: #03081A; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="design-canvas.jsx"></script>
  <script type="text/babel" src="lnb-backgrounds.jsx"></script>
  <script type="text/babel" src="placeholders.jsx"></script>
  <script type="text/babel" src="lnb-data.jsx"></script>
  <script type="text/babel" src="flyers-proximos.jsx"></script>
  <script type="text/babel" src="flyers-otros.jsx"></script>
  <script type="text/babel" src="stories.jsx"></script>
  <script type="text/babel">
    const { DesignCanvas, DCSection, DCArtboard } = window;
    function App() {
      return (
        <DesignCanvas title="LNB Masculino · Apertura 2026" subtitle="Sistema de flyers · 8 equipos · hasta 4 partidos/fecha">
          <DCSection id="proximos" title="01 · Próximos Partidos · 3 variantes · 4 partidos (Feed 1080×1350)">
            <DCArtboard id="prox-v1" label="V1 · Oficial refinado" width={1080} height={1350}><window.ProxV1 /></DCArtboard>
            <DCArtboard id="prox-v2" label="V2 · Grid 2×2" width={1080} height={1350}><window.ProxV2 /></DCArtboard>
            <DCArtboard id="prox-v3" label="V3 · Poster slash rojo" width={1080} height={1350}><window.ProxV3 /></DCArtboard>
          </DCSection>
          <DCSection id="resultado" title="02 · Resultado Final · Feed 1080×1350">
            <DCArtboard id="resultado" label="Resultado con MVP + cuartos" width={1080} height={1350}><window.ResultadoFinal /></DCArtboard>
          </DCSection>
          <DCSection id="jornada" title="03 · Resultados de la Jornada · 4 partidos · Feed 1080×1350">
            <DCArtboard id="jornada" label="Jornada completa" width={1080} height={1350}><window.ResultadosJornada /></DCArtboard>
          </DCSection>
          <DCSection id="tabla" title="04 · Tabla de Posiciones · 8 equipos · Feed 1080×1350">
            <DCArtboard id="tabla" label="Tabla con PJ/G/P/Pts/%/PF/PC/Dif" width={1080} height={1350}><window.TablaPosiciones /></DCArtboard>
          </DCSection>
          <DCSection id="lideres" title="05 · Líderes Estadísticos (estilo flyer oficial)">
            <DCArtboard id="lider-pts" label="Líder en puntos" width={1080} height={1350}><window.LiderPuntos /></DCArtboard>
            <DCArtboard id="lider-reb" label="Líder en rebotes" width={1080} height={1350}><window.LiderRebotes /></DCArtboard>
            <DCArtboard id="lider-ast" label="Líder en asistencias" width={1080} height={1350}><window.LiderAsistencias /></DCArtboard>
          </DCSection>
          <DCSection id="stories" title="06 · Stories Instagram (1080×1920)">
            <DCArtboard id="story-prox" label="Story · Próximos" width={1080} height={1920}><window.StoryProximos /></DCArtboard>
            <DCArtboard id="story-res" label="Story · Resultado" width={1080} height={1920}><window.StoryResultado /></DCArtboard>
            <DCArtboard id="story-tabla" label="Story · Tabla" width={1080} height={1920}><window.StoryTabla /></DCArtboard>
            <DCArtboard id="story-lider-pts" label="Story · Líder en puntos" width={1080} height={1920}><window.StoryLiderPuntos /></DCArtboard>
            <DCArtboard id="story-lider-reb" label="Story · Líder en rebotes" width={1080} height={1920}><window.StoryLiderRebotes /></DCArtboard>
            <DCArtboard id="story-lider-ast" label="Story · Líder en asistencias" width={1080} height={1920}><window.StoryLiderAsistencias /></DCArtboard>
            <DCArtboard id="story-mvp" label="Story · Jugador del partido" width={1080} height={1920}><window.StoryJugadorDelPartido /></DCArtboard>
          </DCSection>
        </DesignCanvas>
      );
    }
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
