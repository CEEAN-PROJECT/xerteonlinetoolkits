/**
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for
 * additional information regarding copyright ownership.

 * The Apereo Foundation licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* _____TEXT PLUS POPCORN PLUGIN_____
	
required: target start name text clearPanel* pauseMedia*
optional: end position* line

*dealt with in mediaLesson.html

*/

(function (Popcorn) {
	Popcorn.plugin("textplus", function(options) {
		
		// define plugin wide variables / functions here
		var $target;
		
		return {
			_setup: function(options) {
				// setup code, fire on initialisation
				var txt = options.name != "" ? '<h4>' + options.name + '</h4>' + x_addLineBreaks(options.text) : x_addLineBreaks(options.text);
				
				if (options.line == "true") {
					if (options.position == "top") {
						txt = txt + "<hr/>";
					} else {
						txt = "<hr/>" + txt;
					}
				}

				$target = $("#" + options.target).hide();
				if(options.overlayPan == "true"){
					$target.parent().hide()
					$target.hide();
					if(options.optional === "true") {
	                    var $openPng = x_templateLocation + "common_html5/plus.png";
						var $showHolder  = $('<div id="showHolder" />').appendTo($target);
						$showBtn = $('<image class="showButton x_noLightBox" type="image" src="' + $openPng + '" >').appendTo($showHolder);
						$showLbl = $("<div class='showLabel'>" + options.name + "</div>").appendTo($showHolder);
						$showHolder
                    	    .click(function () {
                        	    $showHolder.hide();
								$target.prepend(txt);
								$target.parent().addClass("qWindow");
								$target.parent().css({"padding": 5});
                        	});
               		} else {
						$target.parent().css({"padding": 5});
						$target.prepend(txt);
					}
				}
			},
			
			start: function(event, options) {
				// fire on options.start
				if (options.overlayPan) {
					if (options.optional === "false")
					{
						$target.parent().addClass("qWindow");
					}
					var point = JSON.parse(options.points)[0];
					$target.parent().css({
						"top": point.y + "%",
						"left": point.x + "%",
						"padding": 0
					}).show();
				}
				$target.show();
			},
			
			end: function(event, options) {
				// fire on options.end
                if (options.overlayPan) {
					$target.parent().removeClass("qWindow");
					$target.parent().css({
						"top": 0,
						"left": 0,
						"padding": 0
					}).hide();
				}
				$target.hide();
			}
		};
		
	});
})(Popcorn);