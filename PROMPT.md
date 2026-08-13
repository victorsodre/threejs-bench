# Benchmark Three.js — Vilarejo Medieval

Prompt único, usado igual em todas as IAs. Cada resultado vai numa pasta com o nome da IA (`claude/`, `gpt/`, `gemini/`, `grok/`, `grok4.6/`...), sempre `index.html`.

## O prompt (copiar daqui pra baixo)

Crie uma cena 3D interativa em Three.js: um **vilarejo medieval no fim de tarde (golden hour)**.

Regras:

1. **Arquivo HTML único**, sem build e sem servidor — abre com duplo clique. Three.js via CDN.
2. **Proibido baixar assets** (modelos, texturas, HDRIs). Todo modelo é construído por código e toda textura é gerada proceduralmente (canvas ou shader). A qualidade tem que vir do seu código, não de download.
3. O vilarejo deve ter no mínimo: **12 casas de enxaimel** com variações (tamanho, andares, rotação, cor), **igreja com torre**, **moinho de vento com pás girando**, **poço central numa praça de pedra**, **barracas de feira com mercadorias**, **um lago ou rio com água reflexiva animada**, **cercas, árvores, caminhos** e **props** (barris, carroça, fardos de feno).
4. **Vida na cena**: moradores simples caminhando pelo vilarejo, fumaça nas chaminés, pás do moinho girando, lampiões acesos, pássaros, vaga-lumes ao entardecer, nuvens se movendo. Movimento sutil e crível.
5. **Texturas procedurais convincentes**: reboco, madeira com veios, palha, telha, pedra e grama — com relevo (bump/normal), nada de cor chapada.
6. **Iluminação de fim de tarde**: sol baixo e quente com **sombras suaves de alta resolução**, névoa atmosférica, céu com gradiente de pôr do sol, sol visível no horizonte.
7. **Pós-processamento**: no mínimo bloom (janelas acesas, lampiões e sol devem brilhar). Tone mapping cinematográfico.
8. **Câmera orbital** (mouse/trackpad) com passeio automático lento até o usuário interagir.
9. **Assuma uma máquina forte (Apple Silicon M4)**: vegetação instanciada aos milhares, sombras 4K, densidade alta de geometria. Não economize detalhe — o critério de avaliação é impacto visual.
10. Capriche na **direção de arte**: paleta coesa, composição crível de vilarejo, silhueta bonita no horizonte.

Entregue o HTML completo, funcionando de primeira.
