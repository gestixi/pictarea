// ==========================================================================
// Project:     Pictarea
// Description: jQuery plugin to draw HTML Image map areas on a canvas and manage selection
// Copyright:   ©2016-2019 GestiXi
// License:     Licensed under the MIT license (see LICENCE)
// Version:     1.1.0
// Author:      Nicolas BADIA
// ==========================================================================

!function($) { "use strict";

  // ..........................................................
  // PICTAREA PLUGIN DEFINITION
  //

  $.fn.pictarea = function(options) {

    return this.each(function() {
      var that = this,
        $this = $(this),
        data = $this.data('pictarea');

      if (this.tagName !== 'IMG') {
        console.error("pictarea - ERROR: The element must be an img.");
        return;
      }

      if (!data) {
        var didLoad = $this[0].complete,
            formattedOpt = $.extend({}, $.fn.pictarea.defaults, typeof options == 'object' && options),

            loadFunc = function() {
              $this.data('pictarea', (data = new Pictarea(that, formattedOpt)));

              data.drawCanvas(formattedOpt);
            };

        if (didLoad) {
          loadFunc.apply($this[0]);
        }
        else {
          $this.on("load", loadFunc).attr("src", $this.attr("src"));
        }
      }
      else {
        if (typeof options == 'string') data[options]();
      }
    })
  }

  $.fn.pictarea.defaults = {

    /**
      Object of properties which will be apply to the canvas context of the area.

      @type Object
      @default 1
      @since Version 1.0
    */
    normal: {
      fillStyle: 'rgba(255,255,255,.4)',
      strokeStyle: 'rgba(255,255,255,.8)',
      lineWidth: 1
    },

    /**
      Object of properties which will be apply to the canvas context of the area when hovered.

      @type Object
      @since Version 1.0
    */
    hover: {
      fillStyle: 'rgba(255,255,255,.6)',
      strokeStyle: '#fff',
      lineWidth: 2,
      shadowColor: '#fff',
      shadowBlur: 10
    },

    /**
      Object of properties which will be apply to the canvas context of the area when selected.

      @type Object
      @since Version 1.0
    */
    active: {
      fillStyle: 'rgba(255,255,255,.8)',
      strokeStyle: '#f00',
      lineWidth: 2
    },

    /**
      Object of properties which will be apply to the canvas context of the area when disabled.

      @type Object
      @since Version 1.0
    */
    disabled: {
      fillStyle: 'rgba(0,0,0,.4)',
      strokeStyle: 'transparent'
    },

    /**
      Attribe of the area elements which will be used to fill the value property.

      @type String
      @default target
      @since Version 1.0
    */
    areaValueKey: 'target',

    /**
      Attribe of the area elements which will be used to determine if it is disabled.

      @type String
      @default disable
      @since Version 1.0
    */
    areaDisableKey: 'disabled',

    /**
      Maximum number of selections allowed.

      @type Number
      @default 1
      @since Version 1.0
    */
    maxSelections: 1,

    /**
      A boolean indicating if the canvas should be redraw when the window is resized.

      The window size is checked using requestAnimationFrame for good performance.

      @type Boolean
      @default false
      @since Version 1.0
    */
    rescaleOnResize: false,

  };

  // ..........................................................
  // PICTAREA PUBLIC CLASS DEFINITION
  //

  var Pictarea = function(img, options) {
    var that = this;
    that.options = options;
    that.img = img;

    var $img = that.$img = $(img);

    that.src = $img.attr('src');

    that.imgWidth = img.naturalWidth || img.width;
    that.imgHeight = img.naturalHeight || img.height;

    var $img = this.$img,
      usemap = $img.attr('usemap');

    if (!usemap) {
      console.error("pictarea - ERROR: The img element must have a usemap attribute.");
      return;
    }

    var absCss = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
      $map = this.$map = $('map[name="'+usemap.substr(1)+'"]'),
      $initialMap = this.$initialMap = $map.clone(),
      $parent = $('<div class="pictarea"></div>').css({ position:'relative' }),
      $visibleImg = $img.clone().attr({ id: null, class: 'pictarea-img', usemap: null }).css(absCss),
      $canvas = this.createCanvas().css(absCss);

    $img.before($parent).css('opacity', 0).remove();
    $parent.append($visibleImg);
    $parent.append($canvas);
    $parent.append($img);


    this.drawCanvas();

    $map.on('mouseover', function(evt) {
        that.mouseover(evt);
      })
      .on('mouseout', function(evt) {
        that.mouseout(evt);
      })
      .on('click touchstart', function(evt) {
        that.select(evt);
        evt.preventDefault();
      });

    if (options.rescaleOnResize) {
      $(window).resize(function(e) { that.scheduleRedraw(); });
    }
  }

  $.fn.pictarea.Constructor = Pictarea;

  Pictarea.prototype = {

    constructor: Pictarea,

    /**
      The hovered area.

      @type DOM Element
    */
    hovered: null,

    /**
      The selected areas.

      @type Array of DOM Element
    */
    selection: null,

    /**
      The extracted value from the selection.

      @type String or Array
    */
    value: null,

    /**
      @private
    */
    createCanvas: function() {
      var $canvas = $('<canvas style="width:100%;height:100%;"></canvas>'),
        canvas = $canvas[0];

      this.canvas = canvas;
      this.$canvas = $canvas;

      return $canvas;
    },

    /**
      @private
    */
    drawCanvas: function() {
      var canvas = this.canvas;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      canvas.getContext("2d").clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      this.drawZones();
    },

    /**
      @private
    */
    drawZones: function() {
      var that = this,
        $map = this.$map,
        $initialAreas = this.$initialMap.find('area');

      $map.find('area').each(function(index) {
        that.drawZone(this, $initialAreas[index]);
      });
    },

    /**
      @private
    */
    drawZone: function(area, initialArea) {
      var that = this,
        state = 'normal',
        context = this.canvas.getContext('2d'),
        $area = $(area),
        shape = $area.attr('shape').toLowerCase().substr(0,4);

      if (initialArea) {
        var $initialArea = $(initialArea),
          initialCoords = $initialArea.attr('coords').split(','),
          factor = this.imgWidth / this.canvas.offsetWidth;

        for (var i=0; i < initialCoords.length; i++) {
          initialCoords[i] = parseFloat(initialCoords[i]) / factor;
        }
        $area.attr('coords', initialCoords.join(','));
      }

      var coords = $area.attr('coords').split(',');
      for (var i=0; i < coords.length; i++) {
        coords[i] = parseFloat(coords[i]);
      }

      context.save();

      this.drawShape(shape, coords);
      this.styleShape(area);

      context.restore();
    },

    /**
      @private
    */
    drawShape: function(shape, coords) {
      var context = this.canvas.getContext('2d');

      context.beginPath();
      if (shape === 'rect') {
        context.rect(coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1]);
      }
      else if (shape === 'poly') {
        context.moveTo(coords[0], coords[1]);
        for (var i=2; i < coords.length; i+=2) {
          context.lineTo(coords[i], coords[i+1]);
        }
      }
      else if (shape === 'circ') {
        context.arc(coords[0], coords[1], coords[2], 0, Math.PI * 2, false);
      }
      context.closePath();
    },

    /**
      @private
    */
    styleShape: function(area) {
      var context = this.canvas.getContext('2d'),
        options = this.options,
        areaDisableKey = options.areaDisableKey,
        style = options.normal;

      if (areaDisableKey && area.hasAttribute(areaDisableKey)) {
        style = options.disabled;
      }
      else {
        if (area === this.hovered) {
          style = $.extend({}, style, options.hover);
        }
        if (this.selection && this.selection.indexOf(area) > -1) {
          style = $.extend({}, style, options.active);
        }
      }

      $.extend(context, style);
      context.fill();
      context.stroke();
    },

    /**
      @private
    */
    mouseover: function(evt) {
      var area = evt.target,
        options = this.options;

      if (!area) return;

      var mouseoverEvent = $.Event('enterArea.pictarea', {
        originalEvent: evt,
        area: area,
        pictarea: this
      });

      this.$img.trigger(mouseoverEvent);
      if (mouseoverEvent.isDefaultPrevented()) return;

      this.hovered = area;

      this.drawCanvas();
    },

    /**
      @private
    */
    mouseout: function(evt) {
      var area = evt.target;
      if (!area) return;

      var mouseoutEvent = $.Event('leaveArea.pictarea', {
        originalEvent: evt,
        area: area,
        pictarea: this
      });

      this.$img.trigger(mouseoutEvent);
      if (mouseoutEvent.isDefaultPrevented()) return;

      this.hovered = null;
      this.drawCanvas();
    },

    /**
      @private
    */
    select: function(evt) {
      var area = evt.target,
        options = this.options,
        areaDisableKey = options.areaDisableKey;

      if (areaDisableKey && area.hasAttribute(areaDisableKey)) return;

      var areaValueKey = options.areaValueKey,
        selection = this.selection,
        value = null,
        selectEvent = $.Event('selectArea.pictarea', {
          originalEvent: evt,
          area: area,
          key: areaValueKey ? area.getAttribute(areaValueKey) : null,
          pictarea: this
        });

      this.$img.trigger(selectEvent);
      if (selectEvent.isDefaultPrevented()) return;

      if (!selection) selection = [];

      var areaSelIndex = selection.indexOf(area),
        maxSelections = options.maxSelections;

      if (areaSelIndex === -1) selection.push(area);
      else selection.splice(areaSelIndex, 1);

      while (maxSelections >= 0 && selection.length > options.maxSelections) {
        selection.shift();
      }

      if (areaValueKey) {
        if (maxSelections === 1) {
          if (selection[0]) {
            value = selection[0].getAttribute(areaValueKey);
          }
        }
        else if (maxSelections > 1) {
          value = [];

          selection.forEach(function(item) {
            var val = item.getAttribute(areaValueKey);
            if (val) value.push(val);
          });
        }
      }

      this.selection = selection;
      this.value = value;

      this.drawCanvas();

      var changeEvent = $.Event('change.pictarea', {
        originalEvent: evt,
        area: area,
        selection: selection,
        value: value,
        pictarea: this
      });
      this.$img.trigger(changeEvent);
    },

    /**
      Removes the data from the element.

      Here is an example on how you can call the destroy method:

          $image.pictarea('destroy');
    */
    destroy: function() {
      this._isDestroyed = true;
      this.$img.removeData('pictarea');
    },

    /**
      @private

      Schedule a redraw.
    */
    scheduleRedraw: function() {
      if (this._didScheduleScale) return;

      if (window.requestAnimationFrame) {
        var that = this;
        this._didScheduleScale = true;
        requestAnimationFrame(function() { that.drawCanvas(); });
      }
      else {
        this.drawCanvas();
      }
    }
  }
}(window.jQuery);