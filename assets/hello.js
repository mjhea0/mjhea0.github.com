/*
config
 */

let content = {
  text: 'Want to learn Docker, Flask, and React?',
  buttonText: 'Click Here',
  buttonLink: 'https://testdriven.io',
  cookieExpiration: 30,
};

/*
hellobar html string
 */

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
    <a href="javascript:void(0);" class="icon-close">x</a>
  </div>
</div>
`;

/*
event handlers
 */

document.addEventListener('DOMContentLoaded', (event) => {
  if (!getCookie('cookieNotification')) {
    let element = document.createRange().createContextualFragment(helloBar);
    document.body.appendChild(element);
  }
});

window.addEventListener('click', (event) => {
  if(event.target && event.target.matches('a.icon-close')) {
    const helloBarElement = document.getElementById('hellobar-bar');
    fadeOutEffect(helloBarElement);
    setCookie('cookieNotification', 'true', content.cookieExpiration);
  }
});


/*
help functions
 */

function fadeOutEffect(element) {
  let fadeEffect = setInterval(() => {
    if (!element.style.opacity) {
      element.style.opacity = 1;
    }
    if (element.style.opacity < 0.1) {
      clearInterval(fadeEffect);
    } else {
      element.style.opacity -= 0.1;
    }
  }, 40);
}

function getCookieValues(cookie) {
  return cookie.split('=')[1].trim();
}

function getCookieNames(cookie) {
  return cookie.split('=')[0].trim();
}

function getCookie(name) {
  if (!document.cookie) return false;
  const cookies = document.cookie.split(';');
  const cookieValue = cookies.map(getCookieValues)[
    cookies.map(getCookieNames).indexOf(name)];
  return (cookieValue) ? true : false;
}

function daysToMilliseconds(days) {
  return 1000 * 60 * 60 * 24 * days;
}

function setCookie(key, value, expiration) {
  const expirationdate = new Date(
    new Date().getTime() + daysToMilliseconds(expiration)
  );
  document.cookie=`${key}=${value};expires=${expirationdate.toGMTString()};domain=${window.location.hostname};path=/`;
}
