document.addEventListener('DOMContentLoaded', function () {

    Tabletop.init({
        key: "0AhtG6Yl2-hiRdFhTS3h1SnFZY09LRm0tSkdGR2ZWZ2c",
        callback: function (data, tabletop) {
            init(data, 1)
        }
    });

    Tabletop.init({
        key: "0AhtG6Yl2-hiRdEQ4MVpvRHZ6TFRzUUFWMXMwZ1pOWkE",
        callback: function (data, tabletop) {
            init(data, 2)
        }
    });

});

$(window).load(function () {
    $('.holder').hide();
    $('#holder-1').show();
    // this is temporary
    $('#button-1').click(function () {
        $('.holder').hide();
        $('#course-planner .legend').css('visibility', 'hidden');
        $('#holder-1').show();
    });
    $('#button-2').click(function () {
        $('.holder').hide();
        $('#course-planner .legend').css('visibility', 'hidden');
        $('#holder-2').show();
    });
    // this is temporary
    addFunctions();
});

function course(id, title, units, dependencies, link, description, color, area) {
    this.id = id;
    this.title = title;
    this.units = units;
    this.dependencies = dependencies;
    this.link = link;
    this.description = description;
    this.color = color;
    this.area = area;
}

function init(result, id) {
    var colors = {};
    var semesters = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ];

    var section = '<div class="legend" id="legend-' + id + '">\
				<div class="legend-title">Color legend</div>\
				<div class="legend-scale"><ul class="legend-labels"></ul></div></div>';
    var article = '<div class="holder"  id="holder-'    + id + '">\
				<button class="info"></button>\
				<button class="colors"  id="colors-'    + id + '"></button>\
				<button class="more"    id="more-'      + id + '"></button></div>';

    $('#course-planner section').append(section);
    $('#course-planner article').append(article);

    result.colors.elements.forEach(function (row) {
        colors[row.category] = row.color;
        $('#legend-' + id + ' ul.legend-labels').append("<li><span style='background:" + row.color + ";'></span>" + row.legend + "</li>");
    });

    result.courses.elements.forEach(function (row) {
        if (row.number.length > 1 && row.visible == "TRUE") {
            var c = new course(row.number, row.title, row.units, row.dependencies.split(','), row.URL, row.description, colors[row.category], 'core');
            semesters[parseInt(row.semester) - 1].push(c);
        }
    });

    result.placeholders.elements.forEach(function (row) {
        var c = new course(row.number, row.title, null, [], row.URL, row.description, colors[row.category], 'placeholder');
        semesters[parseInt(row.semester) - 1].push(c);
    });

    var graph = new Graph(id, semesters);
}

function addFunctions() {
    $("#course-planner .info").tooltip({
        placement: 'right',
        title: 'View usage'
    });
    $("#course-planner .colors").tooltip({
        placement: 'right',
        title: 'View the color legend'
    });
    $("#course-planner .more").tooltip({
        placement: 'right',
        title: 'Show/hide placeholders'
    });

    $("#course-planner .colors").click(function (e) {
        var num = e.target.id.split('-')[1];
        $("#course-planner .legend-info").css("visibility", "hidden");
        if ($("#course-planner #legend-" + num)[0].style.visibility == "visible") {
            $("#course-planner #legend-" + num).css("visibility", "hidden");
        } else {
            $("#course-planner #legend-" + num).css("visibility", "visible");
        }
    });

    $("#course-planner .info").click(function () {
        $("#course-planner .legend").css("visibility", "hidden");
        if ($("#course-planner .legend-info")[0].style.visibility == "visible") {
            $("#course-planner .legend-info").css("visibility", "hidden");
        } else {
            $("#course-planner .legend-info").css("visibility", "visible");
        }
    });

    $("#course-planner article").click(function (e) {
        if (e.target.className == "colors" || e.target.className == "info") {
            return
        }
        $("#course-planner .legend").css("visibility", "hidden");
        $("#course-planner .legend-info").css("visibility", "hidden");
    });
}

function Graph(id, semesters) {
    var hidden = false;

    function reposition(shape, y, boolean) { // if boolean is true all elements on the same row will reposition
        var list = [];
        var x = shape.attr('cx');
        for (s in shapes) {
            if (shapes[s] != shape && shapes[s].attrs.cy == y) {
                if (boolean) {
                    list.push(shapes[s]);
                } else {
                    if (Math.abs(x - shapes[s].attrs.cx) < shape.attr('r') * 2) {
                        if (x < shapes[s].attrs.cx) {
                            x = shapes[s].attrs.cx - shape.attr('r') * 2 - 2;
                        } else {
                            x = shapes[s].attrs.cx + shape.attr('r') * 2 + 2;
                        }
                    }
                }
            }
        }
        if (shape) {
            list.push(shape);
            shape.clicked = false;
        }
        list.sort(function (a, b) {
            return a.attrs.cx - b.attrs.cx
        });
        var alpha = (350 - (350 * (list.length - 1) / list.length)) / 2;
        for (index in list) {
            if (boolean) {
                x = 350 / list.length * index + alpha;
            }
            list[index].animate({
                cx: x,
                cy: y
            }, 100);
            list[index].pair.animate({
                x: x,
                y: y
            }, 100);
            for (var i = connections.length; i--;) {
                if (connections[i].from.id == list[index].id || connections[i].to.id == list[index].id) {
                    var x1 = x,
                        y1 = y,
                        x2 = connections[i].to.attr("cx"),
                        y2 = connections[i].to.attr("cy");
                    if (connections[i].to.id == list[index].id) {
                        var x1 = connections[i].from.attr("cx"), 
                            y1 = connections[i].from.attr("cy"),
                            x2 = x,
                            y2 = y;
                    }
                    var p = ["M", x1, y1, "L", x2, y2].join(",");
                    var p1 = Raphael.pathIntersection(getCircletoPath(x1, y1, 20), p)[0];
                    var p2 = Raphael.pathIntersection(getCircletoPath(x2, y2, 20), p)[0];
                    var c = 6;
                    var path = ["M", p1.x, p1.y, "C", p2.x - (p2.x - p1.x) / c, p1.y + (p2.y - p1.y) / c, p1.x + (p2.x - p1.x) / c, p2.y - (p2.y - p1.y) / c, p2.x, p2.y].join(",");
                    var arr = r.arrow(p1.x + (p2.x - p1.x) / c, p2.y - (p2.y - p1.y) / c, p2.x, p2.y, 4);
                    var line = connections[i];
                    line.bg && line.bg.animate({
                        path: path
                    }, 100);
                    line.line.animate({
                        path: path
                    }, 100);
                    line.arrow.remove();
                    line.arrow = r.path(arr.path).attr({
                        stroke: line.line.attrs.stroke,
                        fill: line.line.attrs.stroke
                    }).rotate((90 + arr.angle), p2.x, p2.y);
                    if (hidden){
                        if (connections[i].to.area == "placeholder" || connections[i].from.area == "placeholder"){
                            connections[i].arrow.hide();
                        }
                    }
                }
            }
        }
    }

    function createShape(course) {
        var shape = r.circle(course.x, course.y, 20);
        var label = r.text(course.x, course.y, course.id);
        shape.id = course.id;
        shape.area = course.area;
        shape.color = course.color;
        shape.number = course.id.replace('-', '');
        shape.attr({
            fill: shape.color,
            stroke: shape.color,
            "fill-opacity": shape.area == "placeholder" ? 0.5 : 0.7,
            "stroke-width": 2,
            cursor: "move"
        }).toFront();
        label.attr({
            stroke: "none",
            fill: "#fff",
            cursor: "move"
        }).toFront();
        shape.drag(move, dragger, up);
        label.drag(move, dragger, up);
        $.each(course.dependencies, function (j, c) {
            if (c) {
                connections.push(r.connection(r.getById(shape.id), r.getById(c)));
            }
        });
        if (!course.title) {
            getCourseInformation(shape.number, function (data) {
                if (data && data.course) {
                    shape.title = data.course.name.replace(':', '');
                }
            });
        } else {
            shape.title = course.title;
        }
        shape.tooltip(shape.title);
        label.pair = shape;
        label.tooltip(shape.title);
        shape.pair = label;

        shape.dblclick(function () {
            window.open('https://www.cs.qatar.cmu.edu/course/' + this.id, '_blank');
        });
        label.dblclick(function () {
            window.open('https://www.cs.qatar.cmu.edu/course/' + this.pair.id, '_blank');
        });

        return shape;
    }

    function showHidePlaceholders() {
        for (var i = shapes.length; i--;) {
            if (shapes[i].area == "placeholder") {
                if (hidden) {
                    shapes[i].show();
                    shapes[i].pair.show();
                } else {
                    shapes[i].hide();
                    shapes[i].pair.hide();
                }
            }
        }
        for (var i = connections.length; i--;) {
            if (connections[i].from.area == "placeholder" || connections[i].to.area == "placeholder") {
                if (hidden) {
                    connections[i].line.show();
                    connections[i].arrow.show();
                } else {
                    connections[i].line.hide();
                    connections[i].arrow.hide();
                }
            }
        }
        hidden = !hidden;
    }

    function selectCourse(list, hide) {
        for (var i = shapes.length; i--;) {
            shapes[i].animate({
                "fill-opacity": .1,
                "stroke-width": .5
            }, 300);
        }
        for (var i = connections.length; i--;) {
            connections[i].line.animate({
                "stroke-width": 0
            }, 300);
            connections[i].arrow.animate({
                opacity: 0
            }, 300);
        }
        $.each(list, function (i, shape) {
            shape.animate({
                "fill-opacity": 1
            }, 500);
            for (var i = connections.length; i--;) {
                if (connections[i].from.id == shape.id || connections[i].to.id == shape.id) {
                    connections[i].line.animate({
                        stroke: shape.attrs.fill,
                        "stroke-width": 1.5
                    }, 500);
                    connections[i].arrow.animate({
                        stroke: shape.attrs.fill,
                        fill: shape.attrs.fill,
                        opacity: 1
                    }, 500);
                    connections[i].from.animate({
                        "fill-opacity": 1
                    }, 500);
                    connections[i].to.animate({
                        "fill-opacity": 1
                    }, 500);
                }
            }
        });
    }

    function unselectCourse() {
        for (var i = shapes.length; i--;) {
            shapes[i].animate({
                "fill-opacity": .7,
                "stroke-width": 2
            }, 500);
        }
        for (var i = connections.length; i--;) {
            connections[i].line.animate({
                stroke: "#333",
                "stroke-width": 1.5
            }, 200);
            connections[i].arrow.animate({
                stroke: "#333",
                fill: "#333",
                opacity: 1
            }, 200);
        }
    }

    var dragger = function () {
            var shape = this;
            if (this.type == 'text') {
                shape = this.pair;
            }
            selectCourse([shape]);
            shape.ox = shape.attr("cx");
            shape.oy = shape.attr("cy");
            shape.clicked = true;
            if (shape.title) {
                shape.tooltitle.hide();
                shape.tooltip.hide();
            }
        },
        move = function (dx, dy) {
            var shape = this;
            if (this.type == 'text') {
                shape = this.pair;
            }
            var ylimit = shape.oy + dy;
            var xlimit = shape.ox + dx;
            var rcon = 0;
            var lcon = 1000;

            for (var i = connections.length; i--;) {
                if (connections[i].to.id == shape.id) {
                    if (ylimit - connections[i].from.attr("cy") < 75) {
                        if (connections[i].from.attr("cy") > rcon) {
                            rcon = connections[i].from.attr("cy");
                        }
                    }
                }
                if (connections[i].from.id == shape.id) {
                    if (connections[i].to.attr("cy") - ylimit < 75) {
                        if (connections[i].to.attr("cy") < lcon) {
                            lcon = connections[i].to.attr("cy");
                        }
                    }
                }
            }

            if (rcon > 0) {
                dy = rcon - shape.oy + 75;
            }
            if (lcon < 1000) {
                dy = lcon - shape.oy - 75;
            }
            if (ylimit > 580 && lcon == 1000) {
                dy = 580 - shape.oy;
            }
            if (ylimit < 25 && rcon == 0) {
                dy = 25 - shape.oy;
            }
            if (xlimit > 330) {
                dx = 330 - shape.ox;
            }
            if (xlimit < 20) {
                dx = 20 - shape.ox;
            }
            var att = {
                cx: shape.ox + dx,
                cy: shape.oy + dy
            };
            shape.attr(att);
            shape.pair.attr({
                x: shape.attr("cx"),
                y: shape.attr("cy")
            });
            for (var i = connections.length; i--;) {
                if (connections[i].from.id == shape.id || connections[i].to.id == shape.id) {
                    r.connection(connections[i]);
                    if (hidden){
                        if (connections[i].to.area == "placeholder" || connections[i].from.area == "placeholder"){
                            connections[i].arrow.hide();
                        }
                    }   
                }
            }
            r.safari();
        },
        up = function () {
            var shape = this;
            if (this.type == 'text') {
                shape = this.pair;
            }
            if (shape.attr("cy") <= 62.5 + 30) {
                reposition(shape, 25 + 30);
            } else if (shape.attr("cy") <= 137.5 + 30) {
                reposition(shape, 100 + 30);
            } else if (shape.attr("cy") <= 212.5 + 30) {
                reposition(shape, 175 + 30);
            } else if (shape.attr("cy") <= 287.5 + 30) {
                reposition(shape, 250 + 30);
            } else if (shape.attr("cy") <= 362.5 + 30) {
                reposition(shape, 325 + 30);
            } else if (shape.attr("cy") <= 437.5 + 30) {
                reposition(shape, 400 + 30);
            } else if (shape.attr("cy") <= 512.5 + 30) {
                reposition(shape, 475 + 30);
            } else {
                reposition(shape, 550 + 30);
            }
            unselectCourse();
        }

    function initGraph(semesters) {
        var lineattr = {
            stroke: "#555",
            "stroke-dasharray": ". "
        };
        var labeattr = {
            stroke: "none",
            fill: "#555",
            transform: "r90",
            'font-size': '15px'
        };

        r.path('M,0,167.5,L,350,167.5').attr(lineattr);
        r.path('M,0,317.5,L,350,317.5').attr(lineattr);
        r.path('M,0,467.5,L,350,467.5').attr(lineattr);

        semesters.forEach(function (semester, i) {
            semester.forEach(function (child, j) {
                var alpha = (350 - (350 * (semester.length - 1) / semester.length)) / 2;
                var x = 350 / semester.length * j + alpha;
                var y = ((7 - i) * 75) + 25 + 30;
                child.x = x;
                child.y = y;
                var shape = new createShape(child);
                shapes.push(shape);
                labels.push(shape.pair);
                cours.push(shape.id);
            });
        });
    }
    $(".more").click(showHidePlaceholders);
    var r = Raphael('holder-' + id, 400, 605),
        cours = [],
        shapes = [],
        labels = [],
        connections = [];
    initGraph(semesters);
}

Raphael.fn.connection = function (obj1, obj2, line) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var x1 = obj1.attrs.cx,
        y1 = obj1.attrs.cy,
        x2 = obj2.attrs.cx,
        y2 = obj2.attrs.cy;
    var p = ["M", x1, y1, "L", x2, y2].join(",");
    var p1 = Raphael.pathIntersection(getCircletoPath(x1, y1, 20), p)[0];
    var p2 = Raphael.pathIntersection(getCircletoPath(x2, y2, 20), p)[0];
    var c = 6;
    var path = ["M", p1.x, p1.y, "C", p2.x - (p2.x - p1.x) / c, p1.y + (p2.y - p1.y) / c, p1.x + (p2.x - p1.x) / c, p2.y - (p2.y - p1.y) / c, p2.x, p2.y].join(",");
    var arr = this.arrow(p1.x + (p2.x - p1.x) / c, p2.y - (p2.y - p1.y) / c, p2.x, p2.y, 4);

    if (line && line.line) {
        line.bg && line.bg.attr({
            path: path
        });
        line.line.attr({
            path: path
        });
        line.arrow.remove();
        line.arrow = this.path(arr.path).attr({
            stroke: line.line.attrs.stroke,
            fill: line.line.attrs.stroke
        }).rotate((90 + arr.angle), p2.x, p2.y);
    } else {
        return {
            line: this.path(path).attr({
                stroke: "#333",
                "stroke-width": 1.5,
                opacity: .6
            }),
            arrow: this.path(arr.path).attr({
                stroke: "#333",
                fill: "#333"
            }).rotate((90 + arr.angle), p2.x, p2.y),
            from: obj1,
            to: obj2
        }
    }
}

function getCourseInformation(number, callback) {
    var appID = 'ba7e7d9f-686a-4408-b9b5-49d40718a5bc';
    var appKey = '19mSVSVhKyROHlpQ_nMOXIC-OzS5ACP9ItbP0R6FaLjma-UdUaiTFxU6';
    var baseURL = 'https://apis.scottylabs.org/v1/schedule/S14/';
    $.get(baseURL + 'courses/' + number + '?app_id=' + appID + '&app_secret_key=' + appKey,
        callback, "json").fail(function () {
        alert("Error");
    })
}

function getCircletoPath(x, y, r) {
    return ["M", x, (y - r), "A", r, r, 0, 1, 1, (x - 0.1), (y - r), "z"].join(",");
}

Raphael.fn.arrow = function (x1, y1, x2, y2, size) {
    var angle = Math.atan2(x1 - x2, y2 - y1);
    angle = (angle / (2 * Math.PI)) * 360;
    var path = ["M", x2, y2, "L", (x2 - size - 6), (y2 - size), "L", (x2 - size - 6), (y2 + size), "L", x2, y2].join(",");
    return {
        path: path,
        angle: angle
    };
}

Raphael.el.tooltip = function (text) {
    var shape = this;
    if (this.type == 'text') {
        shape = this.pair;
    }
    shape.tooltitle = shape.paper.text(0, 0, text).attr({
        stroke: "none",
        fill: "#fff"
    });
    shape.tooltip = shape.paper.path(getTooltipPath(shape.tooltitle, 'right', 1)).attr({
        fill: '#000'
    });
    shape.tooltitle.hide();
    shape.tooltip.hide();
    this.hover(function (event) {
        if (shape.clicked) return;
        var direction = 'right';
        var position = shape.attr('cx') + 33 + shape.tooltitle.getBBox().width / 2;
        if (position > 350) {
            direction = 'left';
            position = shape.attr('cx') - 33 - shape.tooltitle.getBBox().width / 2;
        }
        if (direction == 'right') {
            var border = shape.attr('cx') + 33 + shape.tooltitle.getBBox().width;
            if (border > 370) {
                direction = 'top';
                position = shape.attr('cx');
            }
        } else {
            var border = shape.attr('cx') - 33 - shape.tooltitle.getBBox().width;
            if (border < 0) {
                direction = 'top';
                position = shape.attr('cx');
            }
        }
        if (direction == 'top') {
            shape.tooltitle.attr({
                x: position,
                y: shape.attr('cy') - 40
            });
        } else {
            shape.tooltitle.attr({
                x: position,
                y: shape.attr('cy')
            });
        }
        shape.tooltip.attr({
            path: getTooltipPath(shape.tooltitle, direction, 1)
        }).show().toFront();
        shape.tooltitle.show().toFront();
    }, function (event) {
        if (shape.tooltitle) {
            shape.tooltitle.hide();
            shape.tooltip.hide();
        }
    });
}

function getTooltipPath(label, direction, position) {
    var tokenRegex = /\{([^\}]+)\}/g,
        objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,
        replacer = function (all, key, obj) {
            var res = obj;
            key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
                name = name || quotedName;
                if (res) {
                    if (name in res) {
                        res = res[name];
                    }
                    typeof res == "function" && isFunc && (res = res());
                }
            });
            res = (res == null || res == obj ? all : res) + "";
            return res;
        },
        fill = function (str, obj) {
            return String(str).replace(tokenRegex, function (all, key) {
                return replacer(all, key, obj);
            });
        };

    var r = 5,
        bb = label.getBBox(),
        w = Math.round(bb.width),
        h = Math.round(bb.height),
        x = Math.round(bb.x) - r,
        y = Math.round(bb.y) - r,
        gap = Math.min(h / 2, w / 2, 10),
        shapes = {
            top: "M{x},{y}h{w4},{w4},{w4},{w4}a{r},{r},0,0,1,{r},{r}v{h4},{h4},{h4},{h4}a{r},{r},0,0,1,-{r},{r}l-{right},0-{gap},{gap}-{gap}-{gap}-{left},0a{r},{r},0,0,1-{r}-{r}v-{h4}-{h4}-{h4}-{h4}a{r},{r},0,0,1,{r}-{r}z",
            bottom: "M{x},{y}l{left},0,{gap}-{gap},{gap},{gap},{right},0a{r},{r},0,0,1,{r},{r}v{h4},{h4},{h4},{h4}a{r},{r},0,0,1,-{r},{r}h-{w4}-{w4}-{w4}-{w4}a{r},{r},0,0,1-{r}-{r}v-{h4}-{h4}-{h4}-{h4}a{r},{r},0,0,1,{r}-{r}z",
            right: "M{x},{y}h{w4},{w4},{w4},{w4}a{r},{r},0,0,1,{r},{r}v{h4},{h4},{h4},{h4}a{r},{r},0,0,1,-{r},{r}h-{w4}-{w4}-{w4}-{w4}a{r},{r},0,0,1-{r}-{r}l0-{bottom}-{gap}-{gap},{gap}-{gap},0-{top}a{r},{r},0,0,1,{r}-{r}z",
            left: "M{x},{y}h{w4},{w4},{w4},{w4}a{r},{r},0,0,1,{r},{r}l0,{top},{gap},{gap}-{gap},{gap},0,{bottom}a{r},{r},0,0,1,-{r},{r}h-{w4}-{w4}-{w4}-{w4}a{r},{r},0,0,1-{r}-{r}v-{h4}-{h4}-{h4}-{h4}a{r},{r},0,0,1,{r}-{r}z"
        },
        mask = [{
            x: x + r,
            y: y,
            w: w,
            w4: w / 4,
            h4: h / 4,
            right: 0,
            left: w - gap * 2,
            bottom: 0,
            top: h - gap * 2,
            r: r,
            h: h,
            gap: gap
        }, {
            x: x + r,
            y: y,
            w: w,
            w4: w / 4,
            h4: h / 4,
            left: w / 2 - gap,
            right: w / 2 - gap,
            top: h / 2 - gap,
            bottom: h / 2 - gap,
            r: r,
            h: h,
            gap: gap
        }, {
            x: x + r,
            y: y,
            w: w,
            w4: w / 4,
            h4: h / 4,
            left: 0,
            right: w - gap * 2,
            top: 0,
            bottom: h - gap * 2,
            r: r,
            h: h,
            gap: gap
        }];
    return fill(shapes[direction], mask[position]);
}