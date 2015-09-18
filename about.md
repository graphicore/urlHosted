*urlHosted* is an **experimental** web app that misuses
the part after the ["#"](https://en.wikipedia.org/wiki/Fragment_identifier)
of a URL to store and read data.

The app is **unhosted**. See this definition from [unhosted.org](https://unhosted.org/):

> Also known as "serverless", "client-side", or "static" web apps, unhosted web apps do not send your user data to their server. Either you connect your own server at runtime, or your data stays within the browser.

This means this app neither stores nor sends any of your
data to any server. Instead, the link that loads the site
must bring it's own data. That data—if it can be read—will
be displayed.

This is **FLOSS—Free Libre Open Source Software**
under the *GPL v3*. [The repository](https://github.com/graphicore/urlHosted) is at GitHub.
The Software is hosted for free directly from [GitHub Pages](https://pages.github.com/)
and anyone can do this!

## How does it work?

Simple. Whenever you visit the site with *payload*
data in the URL, the app renders that data as an article.
When you visit the site without payload data in the URL
you are directly presented with the editor interface.

At any time you can toggle the editor interface using
the **Edit** button at the top of the app.
Regardless if you came with a payload link or not.
To make things easier, the text input for  the main
article text supports [Markdown](https://en.wikipedia.org/wiki/Markdown)
and also a subset of HTML.

Press the **Share!** button whenever you
want to share your article or just store  it in your
bookmarks list. *All data from the form, plus the
current date and time is serialized* and a new
link is created. A box opens and presents the link to
be copied. Note that this box closes as soon as you
modify the data, because the generated link is outdated
then. You can also close the share box at any time by
hitting the **Share!** button again.

## Why?
Well, it's an experiment. I am eager to see if someone
will *make something useful* out of this. Either by being
inspired or by using it directly as a blogging platform.

This tool has already a useful [predecessor](http://tarobish.github.io/Jomhuria/#live)
that I made shortly before. It is a tool to create
web-font test cases instantly in a font development project.
These test cases can then be stored in the according
issue thread in the bug-tracker, [just like here](https://github.com/Tarobish/Jomhuria/issues/32#issuecomment-140595002).

It will also be interesting to see where the technical
limits are. URLs are designed to be short and to point
to resources, not to be the resource by themselves. That
said, I like the idea of saving these URLs at URL-shortener
providers. Take twitter for example, you can instantly
tweet pretty long texts, without having to host them
anywhere. t.co, goo.gl or bit.ly will be your host.

## Who?

My name is Lasse Fister. [My contact data is here](http://graphicore.de/en/page/lasse).

## Caveats
 I don't know about the technical limits like maximal
URL length in different scenarios or how save/persistent
your data is when stored at a URL-shortener. I also don't
know how the legal situation is for hosting a service
like this. If there is trouble I will probably take
it down when indicated and see how to resolve that.

## What else?

Here is a kitten<br />
![cat](https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/S%C3%B6t_kattunge.JPG/320px-S%C3%B6t_kattunge.JPG)<br />
CC-BY-SA-3.0 by Wikimedia user 1qaz2 (has no profile)
