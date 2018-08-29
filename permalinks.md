---
layout: default
title: "Permalinks"
permalink: /permalinks
---

<div>

  <ul>
    {% for post in site.posts %}
      <li>
        <p>https://mherman.org{{ post.redirect_from }}, https://mherman.org{{ post.url }}</p>
      </li>
    {% endfor %}
  </ul>

</div>
