Pictarea
========

jQuery plugin to draw HTML Image map areas on a canvas and manage selection


------

## Installation

Pictarea depends on jQuery. To use it, include this in your page :

    <script src="jquery.js" type="text/javascript"></script>
    <script src="pictarea.js" type="text/javascript"></script>


------

## Usage

For this following HTML:

```html
<img id="map" src="{{ url }}" usemap="#map-mask"/>
<map name="map-mask">
  <area shape="rect" coords="10,10,20,20" alt="description 1" target="1" />
  <area shape="rect" coords="30,30,40,40" alt="description 2" target="2" />
</map>
```


You can call the plugin like this:

```javascript
$(function() {
  $('#map').pictarea({
    rescaleOnResize: true
  });
});
```

The receiver must be an `img` element with its `usemap` attribute defined.

To create image maps, we suggest you to use the [ImageMap](https://docs.gimp.org/en/plug-in-imagemap.html) Gimp plugin.


------

## Options


### normal *{object}*

Object of properties which will be apply to the canvas context of the area.

> **Default:** { fillStyle: 'rgba(255,255,255,.4)', strokeStyle: 'rgba(255,255,255,.8)', lineWidth: 1 }


### hover *{object}*

Object of properties which will be apply to the canvas context of the area when hovered.

> **Default:** { fillStyle: 'rgba(255,255,255,.6)', strokeStyle: '#fff', lineWidth: 2, shadowColor: '#fff', shadowBlur: 10 }


### active *{object}*

Object of properties which will be apply to the canvas context of the area when selected.

> **Default:** { fillStyle: 'rgba(255,255,255,.8)', strokeStyle: '#f00', lineWidth: 2 }


### disable *{object}*

Object of properties which will be apply to the canvas context of the area when disabled.

> **Default:** { fillStyle: 'rgba(0,0,0,.4)', strokeStyle: 'transparent' }

### areaValueKey *{string}*

Attribe of the area elements which will be used to fill the value property.

> **Default:** target


### areaDisableKey *{string}*

Attribe of the area elements which will be used to determine if it is disabled.

> **Default:** disabled


### maxSelections *{number}*

Maximum number of selections allowed.

> **Default:** 1


### updateOnResize  *{boolean}*

A boolean indicating if the canvas should be redraw when the window is resized.

The window size is checked using requestAnimationFrame for good performance.

> **Default:** false


------

## Event


### enterArea.pictarea

This event fires whenever `mouseover` is trigger on an area.


    $img.on('enterArea.pictarea', function(evt) {
      // ex: show a tooltip
      var $area = $(evt.area),
        offset = $img.offset(),
        top = evt.originalEvent.pageY - offset.top,
        left = evt.originalEvent.pageX - offset.left;

      $caption.text($area.attr('alt')).css({ top: top, left: left }).show();
    })


### leaveArea.pictarea

This event fires whenever `mouseout` is trigger on an area.


    $img.on('leaveArea.pictarea', function(evt) {
      // ex: hide the tooltip
      $caption.hide();
    })


### selectArea.pictarea

This event fires whenever an area is clicked or touched.


    $img.on('selectArea.pictarea', function(evt) {
      // ex: prevent the selection
      evt.preventDefault();
    })


### change

This event fires whenever the value has changed.

    $img.on('change.pictarea', function(evt) {
      var selection = evt.selection,
        value = evt.value;

      // ex: display the value in the console
      console.log(value);
    })


------

## Size

Original Size:  3.09KB gzipped (11.38KB uncompressed)

Compiled Size:  **1.85KB gzipped** (4.55KB uncompressed)


------

## Author

**Nicolas Badia**

+ [https://twitter.com/@nicolas_badia](https://twitter.com/@nicolas_badia)
+ [https://github.com/nicolasbadia](https://github.com/nicolasbadia)

------

## Copyright and license

Copyright 2016-2019 GestiXi under [The MIT License (MIT)](LICENSE).
