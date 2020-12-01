System.register(['app/plugins/sdk', 'lodash', 'app/core/utils/kbn', 'app/core/time_series', './external/d3.v3.min', './css/groupedBarChart.css!'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, _, kbn, TimeSeries, d3, panelDefaults;

    return {
        setters: [function (_appPluginsSdk) {
            MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
        }, function (_lodash) {
            _ = _lodash.default;
        }, function (_appCoreUtilsKbn) {
            kbn = _appCoreUtilsKbn.default;
        }, function (_appCoreTime_series) {
            TimeSeries = _appCoreTime_series.default;
        }, function (_externalD3V3Min) {
            d3 = _externalD3V3Min;
        }, function (_cssGroupedBarChartCss) {}],
        execute: function () {
            panelDefaults = {
                legend: {
                    show: true,
                    position: 'On graph'
                },
                chartType: 'stacked bar chart',
                labelOrientation: 'horizontal',
                orientation: 'vertical',
                avgLineShow: true,
                barValuesShow: true,
                labelSpace: 40,
                links: [],
                datasource: null,
                maxDataPoints: 3,
                interval: null,
                targets: [{}],
                cacheTimeout: null,
                nullPointMode: 'connected',
                aliasColors: {},
                format: 'short',
                valueName: 'current',
                strokeWidth: 1,
                fontSize: '80%',
                fontColor: '#fff',
                width: 800,
                height: 400,
                colorSet: [],
                colorSch: []
            };
            class GroupedBarChartCtrl extends MetricsPanelCtrl {

                constructor($scope, $injector, $rootScope) {
                    super($scope, $injector);
                    this.$rootScope = $rootScope;
                    this.hiddenSeries = {};
                    this.data = null;

                    _.defaults(this.panel, panelDefaults);

                    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
                    this.events.on('data-received', this.onDataReceived.bind(this));
                    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
                    this.events.on('data-error', this.onDataError.bind(this));
                    this.events.on('span-changed', console.log);
                }

                onInitEditMode() {
                    this.addEditorTab('Options', 'public/plugins/grafana-groupedbarchart-panel/partials/editor.html', 2);
                    this.addEditorTab('Colors', 'public/plugins/grafana-groupedbarchart-panel/partials/colors.html', 3);
                }

                setUnitFormat(subItem) {
                    this.panel.format = subItem.value;
                    this.render();
                }

                onDataError() {
                    this.render();
                }

                updateColorSet() {
                    var _this = this;

                    this.panel.colorSch = [];
                    this.panel.colorSet.forEach(function (d) {
                        return _this.panel.colorSch.push(d.color);
                    });
                    this.render();
                }

                onDataReceived(dataList) {
                    if (dataList && dataList.length) {
                        var columns = dataList[0].columns.map(function ({ text }) {
                            return text;
                        });
                        this.data = dataList[0].rows.map(function (row) {
                            return columns.reduce(function (accumulator, value, index) {
                                return Object.assign(accumulator, { [value]: row[index] });
                            }, {});
                        });
                    } else {
                        this.data = [{ label: "Machine001", "Off": 15, "Down": 50, "Run": 0, "Idle": 40 }, { label: "Machine002", "Off": 15, "Down": 5, "Run": 40, "Idle": 15 }, { label: "Machine003", "Off": 15, "Down": 30, "Run": 40, "Idle": 15 }, { label: "Machine004", "Off": 15, "Down": 30, "Run": 80, "Idle": 15 }];
                    }

                    this.render();
                }

                formatValue(value) {
                    var decimalInfo = this.getDecimalsForValue(value);
                    var formatFunc = kbn.valueFormats[this.panel.format];
                    if (formatFunc) {
                        return formatFunc(value, decimalInfo.decimals, decimalInfo.scaledDecimals);
                    }
                    return value;
                }

                link(scope, elem, attrs, ctrl) {
                    class groupedBarChart {
                        constructor(opts) {
                            var _this2 = this;

                            this.data = opts.data;
                            this.margin = opts.margin;
                            this.width = parseInt(opts.width, 10);
                            this.height = parseInt(opts.height, 10);
                            this.showLegend = opts.legend;
                            this.legendType = opts.position;
                            this.chartType = opts.chartType;
                            this.orientation = opts.orientation;
                            this.labelSpace = opts.labelSpace;
                            this.fontColor = opts.fontColor;
                            this.labelOrientation = opts.labelOrientation;
                            this.avgLineShow = opts.avgLineShow;
                            this.barValuesShow = opts.barValuesShow;
                            this.axesConfig = [];
                            this.element = elem.find(opts.element)[0];
                            this.options = [];
                            this.data.forEach(function (d) {
                                _this2.options = _this2.options.concat(d3.keys(d));
                            });
                            this.options = _.uniq(this.options.filter(function (key) {
                                return key !== 'label';
                            }));
                            this.avgList = {};
                            this.options.forEach(function (d) {
                                _this2.avgList[d] = 0;
                            });
                            this.options = this.options.filter(function (d) {
                                return d !== 'valores';
                            });
                            this.data.forEach(function (d) {
                                var stackVal = 0;
                                d.valores = _this2.options.filter(function (k) {
                                    return k in d;
                                }).map(function (name, i, o) {
                                    if (i !== 0) stackVal = stackVal + +d[o[i - 1]];
                                    _this2.avgList[name] = _this2.avgList[name] + d[name];
                                    return { name: name, value: +d[name], stackVal: stackVal };
                                });
                            });
                            this.options.forEach(function (d) {
                                _this2.avgList[d] /= _this2.data.length;
                            });
                            if (opts.color.length == 0) {
                                this.color = d3.scale.ordinal().range(d3.scale.category20().range());
                            } else {
                                this.color = d3.scale.ordinal().range(opts.color);
                            }

                            this.draw();
                        }

                        draw() {
                            d3.select(this.element).html("");
                            this.svg = d3.select(this.element).append('svg');
                            this.svg.attr('width', this.width).attr('height', this.height)
                            // .attr('viewBox', `0, 0, ${this.width}, ${this.height}`)
                            .attr('preserveAspectRatio', 'xMinYMin meet').style('padding', '10px').attr('transform', 'translate(0, ' + this.margin.top + ')');

                            this.createScales();
                            this.addAxes();
                            this.addTooltips();
                            this.addBar();
                            d3.select(this.element).attr('style', 'width: ' + this.width * 1.5 + 'px; height: ' + this.height * 1.5 + 'px');
                            if (this.showLegend) this.addLegend(this.legendType);
                        }

                        createScales() {
                            switch (this.orientation) {
                                case 'horizontal':
                                    this.y0 = d3.scale.ordinal().rangeRoundBands([+this.height, 0], .2, 0.5);

                                    this.y1 = d3.scale.ordinal();

                                    this.x = d3.scale.linear().range([0, +this.width]);
                                    this.axesConfig = [this.x, this.y0, this.y0, this.y1, this.x];
                                    break;
                                case 'vertical':
                                    this.x0 = d3.scale.ordinal().rangeRoundBands([0, +this.width], .2, 0.5);

                                    this.x1 = d3.scale.ordinal();

                                    this.y = d3.scale.linear().range([0, +this.height]);

                                    this.axesConfig = [this.x0, this.y, this.x0, this.x1, this.y];
                                    break;
                            }
                        }

                        addAxes() {
                            var axesScale = 1.1;
                            this.xAxis = d3.svg.axis().scale(this.axesConfig[0]).tickSize(-this.height).orient('bottom');

                            this.yAxis = d3.svg.axis().scale(this.axesConfig[1]).orient('left');

                            this.axesConfig[2].domain(this.data.map(function (d) {
                                return d.label;
                            }));
                            this.axesConfig[3].domain(this.options).rangeRoundBands([0, this.axesConfig[2].rangeBand()]);

                            var chartScale = this.chartType === 'bar chart' ? 0 : 1;
                            var domainCal = this.orientation === 'horizontal' ? [0, d3.max(this.data, function (d) {
                                return d3.max(d.valores, function (d) {
                                    return (d.value + chartScale * d.stackVal) * axesScale;
                                });
                            })] : [d3.max(this.data, function (d) {
                                return d3.max(d.valores, function (d) {
                                    return (d.value + chartScale * d.stackVal) * axesScale;
                                });
                            }), 0];
                            this.axesConfig[4].domain(domainCal);

                            var xAxisConfig = this.svg.append('g').attr('class', 'x axis').attr('transform', 'translate(' + this.margin.left + ', ' + (this.height + this.margin.top) + ')').call(this.xAxis).selectAll('text').style('fill', '' + this.fontColor);

                            switch (this.labelOrientation) {
                                case 'horizontal':
                                    break;
                                case '45 degrees':
                                    xAxisConfig.style('text-anchor', 'end').style('transform', 'rotate(-45deg)');
                                    break;
                                case 'vertical':
                                    xAxisConfig.style('text-anchor', 'end').style('transform', 'rotate(-90deg)');
                                    break;
                            }

                            var yAxisConfig = this.svg.append('g').attr('class', 'y axis').attr('transform', 'translate(' + this.margin.left + ', ' + this.margin.top + ')').style('fill', '' + this.fontColor).call(this.yAxis);

                            yAxisConfig.selectAll('text').style('fill', '' + this.fontColor);
                            yAxisConfig.selectAll('path').style('stroke', '' + this.fontColor);
                        }

                        addBar() {
                            var _this3 = this;

                            var scale = this.chartType === 'bar chart' ? 1 : this.options.length;
                            switch (this.orientation) {
                                case 'horizontal':
                                    this.avgLineShow && this.options.forEach(function (d) {
                                        _this3.svg.append('line').attr('x1', _this3.x(_this3.avgList[d])).attr('y1', _this3.height).attr('x2', _this3.x(_this3.avgList[d])).attr('y2', 0).attr('class', d + ' avgLine').attr('transform', 'translate(' + _this3.margin.left + ', ' + _this3.margin.top + ')').style('display', 'none').style('stroke-width', 2).style('stroke', _this3.color(d)).style('stroke-opacity', 0.7);
                                    });

                                    this.bar = this.svg.selectAll('.bar').data(this.data).enter().append('g').attr('class', 'rect').attr('transform', function (d) {
                                        return 'translate(' + _this3.margin.left + ', ' + (_this3.y0(d.label) + _this3.margin.top) + ')';
                                    });

                                    this.barC = this.bar.selectAll('rect').data(function (d) {
                                        return d.valores;
                                    }).enter();

                                    this.barC.append('rect').attr('height', this.y1.rangeBand() * scale).attr('y', function (d) {
                                        return _this3.chartType === 'bar chart' ? _this3.y1(d.name) : _this3.y0(d.label);
                                    }).attr('x', function (d) {
                                        return _this3.chartType === 'bar chart' ? 0 : _this3.x(d.stackVal);
                                    }).attr('value', function (d) {
                                        return d.name;
                                    }).attr('width', function (d) {
                                        return _this3.x(d.value);
                                    }).style('fill', function (d) {
                                        return _this3.color(d.name);
                                    });

                                    break;
                                case 'vertical':
                                    this.avgLineShow && this.options.forEach(function (d) {
                                        _this3.svg.append('line').attr('x1', 0).attr('y1', _this3.y(_this3.avgList[d])).attr('x2', +_this3.width).attr('y2', _this3.y(_this3.avgList[d])).attr('class', d + ' avgLine').attr('transform', 'translate(' + _this3.margin.left + ', ' + _this3.margin.top + ')').style('display', 'none').style('stroke-width', 2).style('stroke', _this3.color(d)).style('stroke-opacity', 0.7);
                                    });

                                    this.bar = this.svg.selectAll('.bar').data(this.data).enter().append('g').attr('class', 'rect').attr('transform', function (d, i) {
                                        return 'translate(' + _this3.x0(d.label) + ', ' + (+_this3.height + _this3.margin.top) + ')';
                                    });

                                    this.barC = this.bar.selectAll('rect').data(function (d) {
                                        return d.valores.map(function (e) {
                                            e.label = d.label;return e;
                                        });
                                    }).enter();

                                    this.barC.append('rect').attr('id', function (d, i) {
                                        return d.label + '_' + i;
                                    }).attr('height', function (d) {
                                        return +_this3.height - _this3.y(d.value);
                                    }).attr('y', function (d) {
                                        return _this3.chartType === 'bar chart' ? _this3.y(d.value) - _this3.height : _this3.y(d.value) - 2 * +_this3.height + _this3.y(d.stackVal);
                                    }).attr('x', function (d, i) {
                                        return _this3.chartType === 'bar chart' ? _this3.x1(d.name) + _this3.margin.left : _this3.x1(d.name) - _this3.x1.rangeBand() * i + _this3.margin.left;
                                    }).attr('value', function (d) {
                                        return d.name;
                                    }).attr('width', this.x1.rangeBand() * scale).style('fill', function (d) {
                                        return _this3.color(d.name);
                                    });

                                    break;
                            }

                            if (this.barValuesShow) {
                                this.chartType === 'bar chart' && this.barC.append('text').attr('x', function (d) {
                                    return _this3.orientation === 'horizontal' ? _this3.x(d.value) + 5 : _this3.x1(d.name) + _this3.x1.rangeBand() / 4 + _this3.margin.left;
                                }).attr('y', function (d) {
                                    return _this3.orientation === 'horizontal' ? _this3.y1(d.name) + _this3.y1.rangeBand() / 2 : _this3.y(d.value) - _this3.height - 8;
                                }).attr('dy', '.35em').style('fill', '' + this.fontColor).text(function (d) {
                                    return d.value ? d.value : '';
                                });
                            }

                            this.bar.on('mouseover', function (d) {
                                _this3.tips.style('left', 10 + 'px');
                                _this3.tips.style('top', 15 + 'px');
                                _this3.tips.style('display', "inline-block");
                                var elements = d3.selectAll(':hover')[0];
                                var elementData = elements[elements.length - 1].__data__;
                                _this3.tips.html(d.label + ' , ' + elementData.name + ' ,  ' + elementData.value);
                                if (_this3.avgLineShow) d3.selectAll('.' + elementData.name)[0][0].style.display = '';
                            });

                            this.bar.on('mouseout', function (d) {
                                _this3.tips.style('display', "none");
                                d3.selectAll('.avgLine')[0].forEach(function (d) {
                                    d.style.display = 'none';
                                });
                            });
                        }

                        addLegend(loc) {
                            var _this4 = this;

                            var labelSpace = this.labelSpace;
                            switch (loc) {
                                case 'On graph':
                                    var defaultOptions = this.chartType == 'bar chart' || this.orientation == 'horizontal' ? this.options.slice() : this.options.slice().reverse();
                                    this.legend = this.svg.selectAll('.legend').data(defaultOptions).enter().append('g').attr('class', 'legend').attr('transform', function (d, i) {
                                        return 'translate(50,' + (i * 20 + _this4.margin.top) + ')';
                                    });

                                    this.legend.append('rect').attr('x', this.width * 1.1 - 18).attr('width', 18).attr('height', 18).style('fill', this.color);

                                    this.legend.append('text').attr('x', this.width * 1.1 - 24).attr('y', 9).attr('dy', '.35em').style('text-anchor', 'end').style('fill', '' + this.fontColor).text(function (d) {
                                        return d;
                                    });
                                    break;
                                case 'Under graph':
                                    this.legend = this.svg.selectAll('.legend').data(this.options.slice()).enter().append('g').attr('class', 'legend').attr('transform', function (d, i) {
                                        return 'translate(' + (+i * labelSpace - _this4.width) + ',' + (+_this4.height + 24 + _this4.margin.top) + ')';
                                    });

                                    this.legend.append('rect').attr('x', function (d, i) {
                                        return i * labelSpace + _this4.margin.left + _this4.width * 1 + 0;
                                    }).attr('width', 18).attr('height', 18).style('fill', this.color);

                                    this.legend.append('text').attr('x', function (d, i) {
                                        return i * labelSpace + _this4.margin.left + _this4.width * 1 + 5;
                                    }).attr('dx', 18).attr('dy', '1.1em').style('text-anchor', 'start').style('fill', '' + this.fontColor).text(function (d) {
                                        return d;
                                    });
                                    break;
                                default:
                                    break;
                            }
                        }

                        addTooltips() {
                            this.tips = d3.select(this.element).append('div').attr('class', 'toolTip');
                        }
                    }

                    function onRender() {
                        if (!ctrl.data) return;
                        var Chart = new groupedBarChart({
                            data: ctrl.data,
                            margin: { top: 30, left: 80, bottom: 10, right: 10 },
                            element: '#chart',
                            width: ctrl.panel.width,
                            height: ctrl.panel.height,
                            legend: ctrl.panel.legend.show,
                            fontColor: ctrl.panel.fontColor,
                            position: ctrl.panel.legend.position,
                            chartType: ctrl.panel.chartType,
                            orientation: ctrl.panel.orientation,
                            labelOrientation: ctrl.panel.labelOrientation,
                            labelSpace: ctrl.panel.labelSpace,
                            avgLineShow: ctrl.panel.avgLineShow,
                            barValuesShow: ctrl.panel.barValuesShow,
                            color: ctrl.panel.colorSch
                        });

                        ctrl.panel.colorSet = [];
                        Chart.options.forEach(function (d) {
                            ctrl.panel.colorSet.push({ text: d, color: Chart.color(d) });
                        });
                    }

                    this.events.on('render', function () {
                        onRender();
                    });
                }
            }

            _export('GroupedBarChartCtrl', GroupedBarChartCtrl);

            GroupedBarChartCtrl.templateUrl = 'partials/module.html';
        }
    };
});
//# sourceMappingURL=ctrl.js.map
