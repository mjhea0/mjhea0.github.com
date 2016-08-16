---
layout: post
toc: true
title: "Sublime Text for Web Developers"
date: 2015-02-05 19:07
comments: true
categories: sublime
keywords: "sublime text, sublime-text 3, sublime, sublime setup"
description: "This article details how to set up Sublime Text for web development."
---

[Sublime Text 3](http://www.sublimetext.com/3) (ST3) is a powerful editor just as it is. But if you want to step up your game, you need to take advantage of all that ST3 has to offer by learning the keyboard shortcuts and customizing the editor to meet your individual needs...

> **NOTE**: This tutorial is meant for Mac OS X users, utilizing HTML, CSS, and JavaScript/jQuery.

Be sure to [set up](https://realpython.com/blog/python/setting-up-sublime-text-3-for-full-stack-python-development/#customizing-sublime-text-3) the `subl` command line tool, which can be used to open a single file or an entire project directory of files and folders, before moving on.

## Keyboard Shortcuts

Goal: Never take your hands off the keyboard!

1. **Command Palette** (*CMD-SHIFT-P*) - Accesses the all-powerful *[Command Palette](http://sublime-text-unofficial-documentation.readthedocs.org/en/latest/reference/command_palette.html)*, where you can run toolbar actions - setting the code syntax, accessing package control, renaming a file, etc..

    ![Command Palette](https://raw.githubusercontent.com/mjhea0/sublime-javascript/master/img/command_palette.png)

1. **Goto Anything** (*CMD-P*) - Searches for a file within the current project or a line or definition in the current file. It's fuzzy so you don't need to match the name exactly.
    - `@` - Definition - class, method, function
    - `:` - Line #
1. **Distraction Free Mode** (*CMD-CTRL-SHIFT-F*) - Eliminates distractions!

    ![Command Palette](https://raw.githubusercontent.com/mjhea0/sublime-javascript/master/img/distraction_free.png)

1. **Hide/Show the Sidebar** (*CMD-K*, *CMD-B*) - Toggles the sidebar.
1. **Comment Your Code** (*CMD-/*) - Highlight the code you want to comment out, then comment it out. If you do not highlight anything, this command will comment out the current line.
1. **Highlight an entire line** (*CMD-L*)
1. **Delete an entire line** (*CMD-SHIFT-K*)
1. **Multi-Edit** (*CMD+D*) - Simply select the word you want to edit, and press *CMD-D* repeatedly until you have selected all the words you want to change/update/etc..

Grab the cheat sheet in [PDF](https://github.com/mjhea0/sublime-javascript/raw/master/sublime_text_keyboard_shortcuts.pdf).

## Configuration

You can customize *almost* anything in ST3 by updating the config settings.

Config settings can be set at the global/default-level or by user, project, package, and/or syntax. Setting files are [loaded](http://www.sublimetext.com/docs/3/settings.html) in the following order:

- `Packages/Default/Preferences.sublime-settings`
- `Packages/User/Preferences.sublime-settings`
- `Packages/<syntax>/<syntax>.sublime-settings`
- `Packages/User/<syntax>.sublime-settings`

**Always apply your custom configuration settings to at the *User* level, since they will not get overridden when you update Sublime and/or a specific package.**

1. **Base User Settings**: *Sublime Text 3 > Preferences > Settings - User*
1. **Package User Specific**: *Sublime Text 3 > Preferences > Package Settings > PACKAGE NAME > Settings - User*
1. **Syntax User Settings**: *Sublime Text 3 > Preferences > Settings - More > Syntax Specific - User*

### Base User Settings

Don't know where to start?

``` json
{
  "draw_white_space": "all",
  "rulers": [80],
  "tab_size": 2,
  "translate_tabs_to_spaces": true,
  "trim_trailing_white_space_on_save": true,
  "word_wrap": true
}
```

Add this to *Sublime Text 3 > Preferences > Settings - User*.

**What's happening?**

1. We convert tabs to two spaces. Now when you press tab, it actually indents two spaces. This is perfect for HTML, CSS, and JavaScript. This creates cleaner, easier to read code.
1. The ruler is a simple reminder to keep your code concise (for readability).
1. We added white space markers and trimmed any trailing (err, unnecessary) white space on save.
1. Finally, word wrapping is automatically applied

What else can you update? Start with the **theme**.

For example -

``` javascript
"color_scheme": "Packages/User/Flatland Dark (SL).tmTheme",
```

Simply add this to that same file.

You can find and test themes online before applying them [here](http://colorsublime.com/).

> Advanced users should look into customizing [key bindings](http://sublime-text-unofficial-documentation.readthedocs.org/en/latest/reference/key_bindings.html), [macros](http://sublime-text-unofficial-documentation.readthedocs.org/en/latest/extensibility/macros.html), and [code snippets](http://sublime-text-unofficial-documentation.readthedocs.org/en/latest/extensibility/snippets.html).

## Packages

Want more features? There's a ton of extensions used to, well, extend ST3's functionality written by the community. *"There's a package for that".*

### Package Control

[Package Control](https://packagecontrol.io/) *must* be installed manually, then, once installed, you can use it to install other ST3 packages. To install, copy the Python code for found [here](https://packagecontrol.io/installation). Then open your console (*CTRL-`*), paste the code, press ENTER. Then Reboot ST3.

![Command Palette](https://raw.githubusercontent.com/mjhea0/sublime-javascript/master/img/package_control.png)

Now you can easily install packages by entering the *Command Palette* (remember the keyboard shortcut?).

1. Type "install". Press ENTER when *Package Control: Install Package* is highlighted
1. Search for a package. Boom!

Let's look at some packages...

### Sublime Linter

[SublimeLinter](http://www.sublimelinter.com/en/latest/) is a framework for Sublime Text linters.

After you install the base package, you need to install linters separately via Package Control, which are easily searchable as they adhere to the following naming syntax - *SublimeLinter-[linter_name]*. You can view all the official linters [here](https://github.com/SublimeLinter).

Start with the following linters:

1. [SublimeLinter-jshint](https://packagecontrol.io/packages/SublimeLinter-jshint)
1. [SublimeLinter-csslint](https://packagecontrol.io/packages/SublimeLinter-csslint)
1. [SublimeLinter-html-tidy](https://packagecontrol.io/packages/SublimeLinter-html-tidy)
1. [SublimeLinter-json](https://packagecontrol.io/packages/SublimeLinter-json)

### Sidebar Enhancements

[Sidebar Enhancements](https://sublime.wbond.net/packages/SideBarEnhancements) extends the number of menu options in the sidebar, adding file explorer actions - i.e., Copy, Cut, Paste, Delete, Rename. This package also adds the same commands/actions to the Command Palette.

![Command Palette](https://raw.githubusercontent.com/mjhea0/sublime-javascript/master/img/sidebar_enhancements.png)

### JsFormat

[JsFormat](https://packagecontrol.io/packages/JsFormat) beautifies your JavaScript/jQuery Code!

Press *CTRL-ALT-F* to turn this mess...

``` javascript
function peopleFromBoulder(arr) {return arr.filter(function(val) {return val.city == 'Boulder';})
    .map(function(val) {return val.name + ' is from Boulder';});}
```

...into...

``` javascript
function peopleFromBoulder(arr) {
    return arr.filter(function(val) {
            return val.city == 'Boulder';
        })
        .map(function(val) {
            return val.name + ' is from Boulder';
        });
}
```

### DocBlockr

[DocBlockr](https://packagecontrol.io/packages/DocBlockr) creates comment blocks based on the context.

Try it!

``` javascript
function refactorU (student) {
    if (student === "Zach") {
        var str = student + " is awesome!";
    } else {
        var str = student + " is NOT awesome!";
    }
    return str;
}
```

Now add an opening comment block - `/**` - and as soon as you press tab, it will create a dummy-documentation-comment automatically.

``` javascript
/**
 * [refactorU description]
 * @param  {[type]}
 * @return {[type]}
 */
function refactorU (student) {
    if (student === "Zach") {
        return student + " is awesome!";
    } else {
        return student + " is NOT awesome!";
    }
}
```

Yay!

### GitGutter

[GitGutter](https://packagecontrol.io/packages/GitGutter) displays icons in the "gutter" area (next to the line numbers) indicating whether an individual line has been modified since your last commit.

![GitGutter](https://raw.githubusercontent.com/mjhea0/sublime-javascript/master/img/gitgutter.png)

### Emmet

With [Emmet](https://packagecontrol.io/packages/Emmet) you can turn a symbol or code abbreviation into a HTML or CSS code snippet. It's by *far* the best plugin for increasing your productivity and efficiency as a web developer.

Try this out: Once installed, start a new HTML file, type a bang, `!`, and then press tab.

``` html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document</title>
</head>
<body>

</body>
</html>
```

Boom!

Check the official [docs](http://docs.emmet.io/abbreviations/) to see all the expressions/symbols/abbreviations that can be used for generating snippets.

## Conclusion

*Go pimp your editor.*

> Want a package? It's just Python. Hire [me](http://mherman.org)!

Comment below. Check out the [repo](https://github.com/mjhea0/sublime-javascript) for my Sublime dotfiles. Cheers!

## Additional Resources

1. [Sublime Text Tips Newsletter](http://sublimetexttips.com/) - awesome tips, tricks
1. [Community-maintained documentation](http://docs.sublimetext.info/en/latest/index.html)
1. [Package Manager documentation](https://packagecontrol.io/docs)
1. [Unofficial documentation reference](http://sublime-text-unofficial-documentation.readthedocs.org/en/latest/reference/reference.html)
1. [Setting Up Sublime Text 3 for Full Stack Python Development](https://realpython.com/blog/python/setting-up-sublime-text-3-for-full-stack-python-development/) - my other ST3 post