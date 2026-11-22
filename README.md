# Essência Serrana — Ateliê & Saboaria

Site do ateliê **Essência Serrana** (sabonetes, velas aromáticas, imagens em gesso pintadas à mão e pratos decorativos, feito na Serra Catarinense).

- `index.html` — **Ateliê**: abertura com o emblema desenhado, logo e texto de apresentação
- `galeria.html` — **Galeria**: quatro salas; role para baixo (ou deslize no celular) e as peças passam de lado
- `css/style.css` — layout (desktop, tablet e celular)
- `js/atelie.js` — menu e o logo que acompanha o mouse
- `js/gallery.js` — parede que anda com a rolagem, fios, luz, minimapa, menu e gesto de deslizar
- `images/` — fotos das peças e `logo-marca.svg` (emblema redesenhado em vetor)

Para trocar ou adicionar uma peça: coloque a foto em `images/` e copie um bloco `<figure class="work">` no `galeria.html`, ajustando `src`, `width`/`height`, `data-ratio` (largura ÷ altura) e os textos.

Para testar localmente, sirva a pasta com qualquer servidor estático (por exemplo `npx serve .`).
