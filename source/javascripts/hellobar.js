let content = {
  text: 'Want to learn Docker, Flask, and React?',
  buttonText: 'Click Here',
  buttonLink: 'https://testdriven.io',
};

let helloBar = `
<div id="hellobar-bar" class="regular closable">
  <div class="hb-content-wrapper">
    <div class="hb-text-wrapper">
      <div class="hb-headline-text">
        <p><span>${content.text}</span></p>
      </div>
    </div>
    <a href="${content.buttonLink}" target="_blank" class="hb-cta hb-cta-button">
      <div class="hb-text-holder">
        <p>${content.buttonText}</p>
      </div>
    </a>
  </div>
  <div class="hb-close-wrapper">
    <a href="javascript:void(0);" class="icon-close" onClick="$('#hellobar-bar').fadeOut()">&#10006;</a>
  </div>
</div>
`;

$(() => {
  $('body').append(helloBar);
});
