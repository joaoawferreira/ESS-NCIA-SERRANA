# Essência Serrana — Galeria

Galeria do ateliê **Essência Serrana** (velas aromáticas, sabonetes artesanais e gesso pintado à mão, feito na Serra Catarinense).

Site estático: role para baixo (ou deslize no celular) e as peças passam de lado, sala por sala.

- `index.html` — conteúdo das salas e das peças
- `css/style.css` — layout (desktop, tablet e celular)
- `js/gallery.js` — parede que anda com a rolagem, fios, luz, minimapa, menu e gesto de deslizar
- `images/` — fotos (do Instagram [@essenciaserrana](https://www.instagram.com/essenciaserrana/)) e ilustrações provisórias (`.svg`)

Para trocar uma peça: coloque a foto em `images/` e ajuste o `src` e o `data-ratio` (largura ÷ altura) no `index.html`.

Para testar localmente, sirva a pasta com qualquer servidor estático (por exemplo `npx serve .`).
