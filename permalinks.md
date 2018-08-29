---
layout: default
title: "Permalinks"
permalink: /permalinks
---

<div>

  <ul>
    {% for post in site.posts %}
      <li>
        <p>{{ post.title | escape }}</p>
        <p><a href="{{ post.redirect_from }}">{{ post.redirect_from }}</a></p>
        <p><a href="{{ post.url }}">{{ post.url }}</a></p>
      </li>
    {% endfor %}
  </ul>

</div>
