<div align="center">
  <img src="https://i.imgur.com/2Zpyrep.png" alt="Fernando Augusto Logo" width="120" />
  <h1>👨‍💻 Fernando Augusto | Full Stack Software Developer</h1>
  
  <p>
    <strong>Repositório oficial do meu Portfólio Pessoal (v3)</strong><br>
    <em>Uma vitrine técnica com estética de terminal, focada em desenvolvimento Full Stack com .NET 8, Angular e SQL Server.</em>
  </p>

  <p>
    <a href="https://nandinaugusto.github.io/portfolio/"><b>🔗 Acessar Portfólio Ao Vivo</b></a>
  </p>

  <p>
    <img alt="HTML5" src="https://img.shields.io/badge/HTML5-111115?style=for-the-badge&logo=html5&logoColor=00ffcc" />
    <img alt="CSS3" src="https://img.shields.io/badge/CSS3-111115?style=for-the-badge&logo=css3&logoColor=00ffcc" />
    <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-111115?style=for-the-badge&logo=javascript&logoColor=00ffcc" />
  </p>
</div>

<br>

## 🌌 Sobre o Projeto

Este portfólio foi desenvolvido do zero para refletir não apenas as minhas habilidades técnicas, mas também a minha identidade como desenvolvedor: um visual escuro de terminal, com uma única cor de destaque, que comunica direto com recrutadores tech e engenheiros.

O foco da arquitetura do site é a **performance**, **semântica** e **internacionalização**.

### ✨ Principais Features

- **Hero 3D (Three.js):** chuva Matrix em profundidade real, com ~9.500 glifos instanciados e animados na GPU, bloom, lente "raio-X" no cursor, onda de choque no clique, paralaxe e voo da câmera no scroll, além de um passe CRT (aberração cromática, scanlines, vinheta). Carregado sob demanda só no desktop (`hero3d.js`). Celulares e fallback usam uma chuva em canvas 2D.
- **Estética de Terminal:** prompt `nando@debian:~$`, tipografia IBM Plex Sans + IBM Plex Mono, efeito de decodificação Matrix no nome e nos títulos, moldura com feixe de luz na foto e spotlight seguindo o cursor nos cards.
- **Internacionalização Dinâmica (i18n):** Português (PT-BR), Inglês (EN) e Espanhol (ES) sem recarregar a página. O PT fica no próprio HTML (bom para SEO) e EN/ES vêm de um dicionário único no script, ligado aos elementos por `data-i18n`.
- **Arquitetura CSS Moderna:** CSS puro com design tokens (cor, espaçamento, raio, z-index), Grid Layout, Flexbox e barra de progresso com `animation-timeline: scroll()`, sem dependências como Bootstrap ou Tailwind.
- **Fully Responsive:** Layout fluido que se adapta desde monitores ultrawide até telas de smartphones, com menu mobile interativo (`fullscreen overlay`).
- **SEO & Acessibilidade (a11y):** Tags HTML5 semânticas, atributos ARIA para leitores de tela e suporte a preferência de sistema para animações (`prefers-reduced-motion`).

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído **sem frameworks de UI**, provando o domínio sobre a tríade fundamental da web:

* **HTML5:** Marcação semântica profunda e estruturação de dados para SEO.
* **CSS3 Vanilla:** Animações chave (`@keyframes`), propriedades customizadas (variáveis globais), layout fluido e design responsivo.
* **JavaScript (ES6+):** Internacionalização, efeito de decodificação, menu mobile e modal acessíveis (focus trap, Escape) e animações de entrada com `IntersectionObserver`.
* **Three.js + GLSL:** shaders próprios para a chuva instanciada e o passe CRT, com `UnrealBloomPass` para o brilho.

## 🚀 Como Executar Localmente

Como o projeto é totalmente estático e não requer build steps (Node.js/NPM), você pode rodá-lo de forma extremamente simples:

1. Clone este repositório:
   ```bash
   git clone https://github.com/NandinAugusto/portfolio.git
   ```
2. Acesse o diretório:
   ```bash
   cd portfolio
   ```
3. Abra o arquivo `index.html` diretamente no seu navegador, ou utilize uma extensão como o **Live Server** no VS Code para auto-reload.

## 🤝 Contato & Conexões

Fique à vontade para explorar o código-fonte! Se quiser bater um papo sobre Engenharia de Dados, Backend, .NET Core, Python ou integrações complexas:

* 💼 **LinkedIn:** [Fernando Augusto](https://www.linkedin.com/in/fernando-brito-8aa4271a7/)
* 🐙 **GitHub:** [@NandinAugusto](https://github.com/NandinAugusto)
* 📧 **E-mail:** fernando.dev.brito@gmail.com

---

<div align="center">
  <small>Projetado e desenvolvido por Fernando Augusto &copy; 2025</small>
</div>
