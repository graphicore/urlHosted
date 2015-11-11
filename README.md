# urlHosted

Store the data of your blog (or anything else) in the "#" part of the URL as Base64 encoded, zipped JSON.

To see a demonstration of this tool visit this link: [goo.gl/DYxr5m](http://goo.gl/DYxr5m) there is also an explanation.

## Make your own custom urlHosted Application

I took the original design apart to make a common `BaseController` class and a
custom `URLHostedController` the latter defines the data that is stored and how
that data is displayed. It should be easy to build your own thing from there.

Just take Look into the files.

You are welcome to contribute more and/or better documentation.

# License

GPL v3 (c) 2015 Lasse Fister
