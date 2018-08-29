---
layout: post
title: "Atom for Web Developers"
date: 2016-08-16 07:25:39
comments: true
toc: true
categories: [atom, code editor]
keywords: "atom, atom.io, atom setup"
description: "This article details how to set up Atom for web development."
redirect_from:
  - /blog/2016/08/16/atom-for-web-developers/
---

This is a no frills look at [Atom](https://atom.io/), a powerful, open-source text editor maintained by the GitHub team.

<div style="text-align:center;">
  <img src="/assets/img/blog/atom/atom-logo.png" style="max-width: 100%; border:0; box-shadow: none;" alt="atom logo">
</div>

<br>

{% if page.toc %}
{% include contents.html %}
{% endif %}

Atom comes with a number of [features](http://flight-manual.atom.io/using-atom/) right out of the box. However, its true power comes from the [package management system](https://atom.io/packages), allowing you to customize the editor to meet your specific development needs.

New to Atom? Start by reading the first two chapters from the [Atom Flight Manual](http://flight-manual.atom.io/).

> **NOTE**: This tutorial is meant for full-stack JavaScript developers, and it uses Atom version [1.8.0](https://github.com/atom/atom/releases/tag/v1.8.0).

This is a companion piece to [Sublime Text for Web Developers](http://mherman.org/blog/2015/02/05/sublime-text-for-web-developers/#.V5QIBZOAOko).

## Keyboard Shortcuts

Remember: The goal is to never take your hands off the keyboard!

1. **Command Palette** (*CMD-SHIFT-P*) - Opens the powerful *[Command Palette](https://github.com/atom/command-palette)*, where you can access all Atom commands and packages.
1. **Hide/Show the Sidebar** (*CMD-K*, *CMD-B*) or (*CMD-\\*) - Toggles the sidebar.
1. **Comment Your Code** (*CMD-/*) - Highlight the code you want to comment out, then comment it out. If you do not highlight anything, this command will comment out the current line.
1. **Highlight an entire line** (*CMD-L*)
1. **Duplicate line** (*CMD-SHIFT-D*)
1. **Move line Up or Down** (*CMD-CTRL-Up/Down Arrow*)
1. **Multi-Edit** (*CMD-D*) - Simply select the word you want to edit, and press *CMD-D* repeatedly until you have selected all the words you want to update. Go too far? Use *CMD-U* to unselect.
1. **Change the language** (*CTRL-SHIFT-L*)
1. **Settings** (*CMD-,*) - Opens the *Settings* menu where you can update settings, download and configure packages, and change themes.

Check out the [Atom shortcut cheat sheet](https://github.com/mjhea0/atom-keyboard-shortcuts) for more handy keyboard shortcuts.

## Settings

Much like Sublime Text, you can customize *almost* every aspect of Atom.

Start by reading over the [Basic Customization guide](http://flight-manual.atom.io/using-atom/sections/basic-customization/) to learn how to update the global and language-specific settings. If you're just getting started, I recommend leaving the settings just as they are, since Atom comes with a solid set of defaults.

That said, you may way to update the UI and syntax themes from the *Settings* menu. The Flatland Dark [UI](https://atom.io/themes/flatland-dark-ui) and [Syntax](https://atom.io/themes/flatland-dark) themes are rather pleasing...

<div style="text-align:center;">
  <img src="/assets/img/blog/atom/atom-flatland.png" style="max-width: 100%; border:0; box-shadow: none;" alt="atom flatland theme">
</div>

<br>

...but make sure to [experiment on your own](https://atom.io/themes)!

## Packages

Again, like Sublime Text, Atom's core features can be extended via the powerful [package management system](https://atom.io/packages). Navigate to the Settings menu to download and/or configure packages.

### Linter

[Linter](https://atom.io/packages/linter) is the base package (and API) for a [number of language-specific linters](http://atomlinter.github.io/). There's support for all the main languages. Start with the following linters to start checking for style and syntactic errors:

1. [linter-jshint](https://atom.io/packages/linter-jshint)
1. [linter-csslint](https://atom.io/packages/linter-csslint)
1. [linter-htmlhint](https://atom.io/packages/linter-htmlhint)
1. [linter-json-lint](https://atom.io/packages/linter-json-lint)

### Highlight Selected

With [Highlight Selected](https://atom.io/packages/highlight-selected) you double click a word to highlight every instance of it in the open file.

### docblockr

[docblockr](https://atom.io/packages/docblockr) simplifies the writing of documentation. Once installed, simply press ENTER after you type *\\*\** to add a basic comment:

```javascript
/**
 *
 **/
```

If the line directly after contains a function, then the name and parameters are parsed and added to the comments.

Try it out:

```javascript
function getTotalActiveLessons(chapters) {
  var total = chapters.reduce(function(acc, chapter) {
    var active = (chapter.lessons).filter(function(lesson) {
      return lesson.lessonActive;
    });
    return acc.concat(active);
  }, []);
  return total;
}
```

Given the above function, add an opening block (`/**`), and then when you press ENTER it automatically creates the base documentation:

```javascript
/**
 * [getTotalActiveLessons description]
 * @param  {[type]} chapters [description]
 * @return {[type]}          [description]
**/
function getTotalActiveLessons(chapters) {
  var total = chapters.reduce(function(acc, chapter) {
    var active = (chapter.lessons).filter(function(lesson) {
      return lesson.lessonActive;
    });
    return acc.concat(active);
  }, []);
  return total;
}
```

### File Icons

As the name suggests, [File Icons](https://atom.io/packages/file-icons) adds icons to a filename within the sidebar tree based on the file type "for improved visual grepping". In other words, you can find a file from the tree at a quick glance. You can specify whether you want the icons in color or not as well.

### Emmet

Type an abbreviation about the HTML or CSS you want and [Emmet](https://atom.io/packages/emmet) expands it out for you. For example, pressing TAB after `ul#sample-id>li.sample-class*2` will output:

```html
<ul id="sample-id">
  <li class="sample-class"></li>
  <li class="sample-class"></li>
</ul>
```

Check out the [abbreviation syntax](http://docs.emmet.io/abbreviations/syntax/) for more info.

### less-than-slash

If you're used to Sublime Text, then you will definitely want [less-than-slash](https://atom.io/packages/less-than-slash), as you can close out a tag when you type `</`.

### Todo Show

[Todo Show](https://atom.io/packages/todo-show) summarizes all `TODO`, `FIXME`, `CHANGED`, `XXX`, `IDEA`, `HACK`, `NOTE`, `REVIEW` comments, scattered throughout your code, in a nice organized list.

Press *CTRL-SHIFT-T* to activate:

<div style="text-align:center;">
  <img src="/assets/img/blog/atom/atom-todo-show.png" style="max-width: 100%; border:0; box-shadow: none;" alt="atom todo show">
</div>

<br>

## Conclusion

That's it. Start here, but be sure to check out all the [Atom packages](https://atom.io/packages) (nearly 5,000 as of writing!) to fully personalize your development environment. Can't find a package? Put your coding skills to use and write your own package, and then support the community by open sourcing the package!

Comment below with any packages that I missed. Cheers!
