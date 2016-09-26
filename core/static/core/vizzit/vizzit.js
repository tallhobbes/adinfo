
//functions n stuff


////// Make color pallette //////
var mk_pallete = function(names){
	names = d3.map(names, function(d){return d}).keys().sort(function(a,b){
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});
	pal = {};
	l = names.length;
	names.forEach(function(n,i){
		pal[n] = "hsl(" + i/l *360 + ",60%,70%)"
	});
	return pal;
}

/////// Just Cookie Monster Things //////
//Cookies for viewed history
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + "; " + expires;
}
function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
        c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
    }
  }
  return "";
}
var visited = getCookie('visited').split(',');
//Blurb text
//Claim staker
blurb = 'Hover over line to see post title<br>Hover on color tile to highlight subreddit posts<br>Double-click color tile to isolate subreddit posts'
d3.select('#title_text').html(blurb)

//stuff for setting up viz
var vizzit = {}, dataSeries, data2, legend, viewport, zoom, subscores, uniq;
var getSortedKeys = function(obj){
	keys = [];
	for(key in obj){keys.push(key)}
	return keys.sort(function(a,b){return obj[b]-obj[a]});
}
var removeAfromB = function(a,b){
	b.splice(b.indexOf(a),1)
}
/////state updater////
var iso = '';
var clicked = [];
var isoToggle = function(d){
	iso === d.subreddit ? iso = '' : iso = d.subreddit;
	iso === d.subreddit ? clicked=[d.subreddit]:removeAfromB(d.subreddit, clicked);
	if(iso.length){
		d3.selectAll('.leglab').classed('hidden', true);
		d3.selectAll('.line').classed('hidden', true);
		d3.selectAll('.leglab.'+iso).classed('hidden',false);
		d3.selectAll('.line.'+iso)
			.classed('hidden',false)
			.classed('clicked',true);
	}else{
		//d3.selectAll('.leglab').classed('hidden',false);
		d3.selectAll('.line')
			.classed('hidden', false)
			.classed('clicked',function(d){
				return isLineClicked(d)
			});
	}
	// for(i in clicked_sub){
	// 	d3.selectAll('.'+clicked_sub[i])
	// 		.classed('hidden',false);
	// }
}
var shouldHideSub = function(sub){
	return sub != iso && clicked.indexOf(sub)===-1;
}
var shouldHideLine = function(sub){
	if(!iso.length){return false};
	return sub != iso && clicked.indexOf(sub)===-1;
}
var toggleClicked = function(sub){
	ind = clicked.indexOf(sub);
	if(ind === -1){
		clicked.push(sub);
	}else{
		clicked = clicked.slice(0,ind).concat(clicked.slice(ind+1,clicked.length));
	}
}
var isLineClicked = function(d){
	return clicked.indexOf(d.id) > -1 || clicked.indexOf(d.subreddit) > -1;
}

//////////////////
//common behaviors
//////////////////
//
//// for posts (lines)
var post = {}
post.mouseover = function(d){
	//console.log(d);
	d3.select('.leg-group.'+d.subreddit).classed('hover',true);
	d3.select('#l_'+d.id)
		.classed('hover',true)
		.classed('hidden',false);
	d3.select('.leglab.'+d.subreddit).classed('hidden',false)
	d3.select('#title_text')
		.text(d.title)
		.style('color',pal[d.subreddit]);
}
post.mouseout = function(d){
	d3.select('.leg-group.'+d.subreddit).classed('hover',false);
	d3.select('#l_'+d.id)
		.classed('hover',false)
		.classed('hidden',function(d){
			return shouldHideLine(d.subreddit);
		})
	d3.select('.leglab.'+d.subreddit).classed('hidden',function(d){
		return shouldHideSub(d.subreddit);
	})
	d3.select('#title_text')
		.html(blurb)
		.style('color','white');
}
post.click = function(d){
	toggleClicked(d.id)
	d3.select('#l_'+d.id)
		.classed('visited', true)
		.classed('clicked',function(d){
			return clicked.indexOf(d.id)>=0 || clicked.indexOf(d.subreddit)>=0
		});
	//add to visited list
	if(visited.indexOf(d.id) === -1) {
		visited.push(d.id)
		//store id's of visited links for 5 days
		setCookie('visited',visited,5);
	}
	window.open('http://www.reddit.com'+d.permalink, '_blank');
	console.log('http://www.reddit.com'+d.permalink);
	console.log(d.url);

}
//
//// for titles (on right)
var title = {}
title.mouseover = function(d){
	var text = d3.select('#t_'+d.id);
	if(text[0][0]!==null){
		//var textwidth = text[0][0].getComputedTextLength();
		if(text.attr('orig_width')>titles_width){
			//console.log(text);
			text
				.transition()
				.attr('x',titles_width)
		}
		text
			.style('font-weight','bold')
			.classed('shadow', true);
	}
}
title.mouseout = function(d){
	var text = d3.select('#t_'+d.id);
	text
		.style('font-weight','normal')
		.classed('shadow',false)
		.transition()
		.attr('x',function(){
			return +(d3.select(this).attr('orig_width'))
		});
}
//enclosed version of graph maker?
vizzit.timelines = function(){
	var xScale = d3.time.scale(),
		yScale = d3.scale.linear();
	//Set up line drawing function 
	var lineGen = d3.svg.line()
		.x(function(d) {return xScale(d.time);})
		.y(function(d) {return yScale(d.rank);})
		.interpolate('bundle')
		.tension(1.0)
		.defined(function(){
			for(var i = 0; i<arguments.length; i++){
				if(arguments[i]==='gap'){
					return false;
				}
			}
			return true;
		});
	var lineGen3 = function(d){
		//limit data to only when there are changes in rank
		d2 = [d[0]];
		for(var i=1; i<d.length; i++){
			//check for time gap, make it 130 seconds to cover missed updates
			if(d[i].time.getTime() > d[i-1].time.getTime()+(130*1000)){
				//ensure prior minute is recorded so line change time is accurate
				if(d2[d2.length-1].time != d[i-1].time){
					d2.push(d[i-1]);
				}
				d2.push('gap');
				d2.push(d[i])
			}
			//check to see if rank changed
			else if(d[i].rank != d[i-1].rank){
				//ensure prior minute is recorded so line change time is accurate
				if(d2[d2.length-1].time != d[i-1].time){
					d2.push(d[i-1]);
				}
				d2.push(d[i]);
			}
		}
		//and add last datapoint if not already there
		if(d2[d2.length-1].time != d[d.length-1].time){
			d2.push(d[d.length-1])
		}
		d4 = [[d2]];
		//return(d4.forEach(function(d){return(lineGen(d))}));
		return lineGen(d2);
	}
	//Function for taking appended data and making interactive lines 
	var lines = function(linegroups){
		var paths = linegroups
			.selectAll('path')
			.data(function(d){
				//console.log([d]);
				return [d];
			});
		paths.enter().append('path');
		
		paths.attr('class',function(d){
				return d.subreddit
			})
			.attr('id', function(d){return 'l_'+d.id;})	
			.classed('line',true)
			.attr('d',function(d){return(lineGen3(d.log))})
			.style('stroke', function(d){return(pal[d.subreddit])})			
			.classed('visited',function(d){return visited.indexOf(d.id)>=0})
			.classed('hidden', function(d){return shouldHideLine(d.subreddit)})
			.classed('clicked',function(d){return clicked.indexOf(d.id)>=0 || clicked.indexOf(d.subreddit)>=0})
			.on('mouseover', function(d){post.mouseover(d);title.mouseover(d)})
			.on('mouseout', function(d){post.mouseout(d);title.mouseout(d)})
			.on('click', function(d){post.click(d)})};

	var timelines = function(selection){
		selection.each(function(data){
			series = d3.select(this).selectAll('.viz-data').data([data]);
			series.enter().append('g').classed('viz-data', true);
			linegroups = series.selectAll('.line-group')
				.data(data, function(d){
					return d.id;
				});
			linegroups.enter()
				.append('g')
				.classed('line-group', true);
			lines(linegroups);
			linegroups.exit().remove();
		});
	};
	//Add getter/setter functions for scales
	timelines.xScale = function(value){
		if(!arguments.length){
			return xScale;
		}
		xScale = value;
		return timelines;
	};
	timelines.yScale = function(value){
		if(!arguments.length){
			return yScale;
		}
		yScale = value;
		return timelines;
	};
	//return the newly reassembled function..?
	return timelines;
};

/////// Legend creationg function //////
vizzit.legend = function(){
	var min,max;
	legXscale = d3.scale.linear().range([0,width]);
	//var subscores;
	var calc_score = function(d){
		score = 0;
		d.log.forEach(function(l){
			if(l.time>=min &&l.time<=max){
				score += 25-l.rank;
			}
		});
		return score;
	}
	var calcLegend = function(data){
		//calculate "score" for each subreddit
		scores = {};
		total = 0;
		min = xScale.domain()[0], max = xScale.domain()[1];
		data.forEach(function(d){
			score = calc_score(d);
			if(score>0){
				if(!scores[d.subreddit]) {scores[d.subreddit]=0};
				scores[d.subreddit] += score;
				total += score;
			}
		});
		order = getSortedKeys(scores);
		legXscale.domain([0,total]).range([0,width]);
		sofar = 0;
		legendData = []
		for(k in order){
			key = order[k];
			slug = {}
			slug.subreddit = key;
			slug.start = sofar;
			slug.end = sofar + scores[key]
			slug.width = scores[key]
			sofar = sofar + scores[key]
			legendData.push(slug);
		}
		return legendData;	
	}
	var boxes = function(leggroups){
		var rects = leggroups
			.selectAll('.legbox')
			.data(function(d){
				return [d];
			});
		rects.enter()
			.append('rect');
		rects
			.attr('class',function(d){
				return d.subreddit})
			.classed('legbox',true)
			.transition()
			.duration(1100)
			.attr('x', function(d){
				return legXscale(d.start);
			})
			.attr('y', legend_height-15)
			.attr('width', function(d){
				return legXscale(d.width);
			})
			.attr('height', 15)
			.attr('fill',function(d){
				return pal[d.subreddit];
			})
		rects
			.on('click', function(d){
				toggleClicked(d.subreddit);
				d3.selectAll('.line.'+d.subreddit)
					.classed('clicked', function(d){
						return clicked.indexOf(d.subreddit)>=0
					});
			})
			.on('dblclick', function(d){
				isoToggle(d);
			})
			.on('mouseover', function(d){
				d3.select('.'+d.subreddit+'.leg-group')
					.classed('hover',true);
				d3.selectAll('.line.'+d.subreddit)
					.classed('hidden', false)
					.classed('hover',true);
				d3.selectAll('.leglab.'+d.subreddit)
					.classed('hidden', false);
				//console.log(d.hid);
			})
			.on('mouseout', function(d){
				//console.log(d.hid)
				d3.select('.leg-group.'+d.subreddit).classed('hover',false);
				d3.selectAll('.line.'+d.subreddit)
					.classed('hidden', function(d){
						return shouldHideLine(d.subreddit)
					})
					.classed('hover',false);
				d3.selectAll('.leglab.'+d.subreddit)
					.classed('hidden', shouldHideSub(d.subreddit));
			})
	}
	leglables = function(leggroups){
		var labs = leggroups
			.selectAll('.leglab')
			.data(function(d){
				return [d];
			});
		labs.enter()
			.append('text');
		labs
			.attr('class',function(d){
				return d.subreddit;
			})
			.classed('leglab',true)
			.classed('hidden',function(d){
				return shouldHideSub(d.subreddit);
			})
			.transition()
			.each('start', function(d){
				d3.select(this).classed('hidden',false)
			})
			.each('end', function(d){
				d3.select(this).transition().delay(700).each('end', function(d){
					d3.select(this).classed('hidden',function(d){
						return shouldHideSub(d.subreddit);
					})
				})
			})
			.duration(1100)
			.attr('x', function(d){
				return d.start>(legXscale.domain()[1]/2)?legXscale(d.end):legXscale(d.start);
			})
			.attr('y', 12)
			.text(function(d){return d.subreddit})
			.attr('fill',function(d){
				return pal[d.subreddit];
			})
			.attr('text-anchor',function(d){
				return d.start>(legXscale.domain()[1]/2)?'end':'start'
			});
	}
	legend = function(selection){
		selection.each(function(data){
			legendData = calcLegend(data);
			//console.log(legendData);
			series_leg = d3.select('.legendArea').selectAll('.leg-data').data([legendData]);
			series_leg.enter().append('g').classed('leg-data', true);
			leggroups = series_leg.selectAll('.leg-group')
				.data(legendData, function(d){
					return d.subreddit;
				});
			leggroups.enter()
				.append('g')
				.attr('class',function(d){return d.subreddit})
				.classed('leg-group', true)
			boxes(leggroups);
			leglables(leggroups);
			leggroups.exit().remove();
		});
	}
	return legend;
}

/////// Labels for most recent 25 posts //////
vizzit.titles = function(){
	getRankedTitles = function(data){
		titles = Array(25);
		times = {};
		extime = xScale.domain()[1];
		var r = 0;
		suspects = data.filter(function(d){
			return d.log[0].time <= extime && d.log[d.log.length-1].time>=extime
		});
		suspects.forEach(function(d,i){
			//console.log(d.id);
			if(d.log.length > 1){
				for(i=0; i<d.log.length-1; i++){
					if(d.log[i].time<=extime && d.log[i+1].time>=extime){
						//console.log('normal find');
						//console.log(d.log[i].rank);
						d.log[i+1]===extime ? r = d.log[i].rank : r = d.log[i+1].rank
						//r = d.log[i].rank;
						if (titles[d.log[i].rank]!==undefined){
							//console.log('intruder!');
							stamps = times[d.log[i].rank].concat([d.log[i].time, d.log[i+1].time]);
							//console.log(stamps);
							stamps.forEach(function(s,i){stamps[i] = Math.abs(s.getTime()-extime.getTime())});
							if(stamps.indexOf(d3.min(stamps))>1){
								//console.log('intruder is more recent: ',d.title.slice(0,30));
								titles[d.log[i].rank] = {id:d.id, title:d.title, subreddit: d.subreddit, rank:r};
								times[d.log[i].rank] = [d.log[i].time, d.log[i+1].time]
							};
						} else {
							titles[d.log[i].rank] = {id:d.id, title:d.title, subreddit: d.subreddit, rank:r};
							times[d.log[i].rank] = [d.log[i].time, d.log[i+1].time]							
						}
						continue;
					}
				}
			} else if(d.log.length===1){
				if(d.log[0].time.getTime() === extime.getTime()){
					//console.log(d.log[0].rank);
					titles[d.log[0].rank] = {id:d.id, title:d.title, subreddit: d.subreddit, rank:d.log[0].rank};							
				}
			} else{console.log('...ummm....')}
		});
		return titles;
	}
	var titletext = function(titgroups){
		var tits = titgroups
			.selectAll('.tittext')
			.data(function(d){return [d]});
		tits.enter()
			.append('text');
		tits
			.attr('class','tittext ')
			.attr('id',function(d){return 't_'+d.id})
			.text(function(d){return d.title})
			.attr('text-anchor','end')
			.attr('orig_width', function(){
				return( d3.select(this)[0][0].getBBox().width);
			})
			.transition()
			.attr('x',function(d){
				return +(d3.select(this).attr('orig_width')) })
			.attr('y',function(d){return yScale(d.rank)})
			.attr('fill',function(d){return pal[d.subreddit]});
		tits
			.on('mouseover', function(d){
				title.mouseover(d);
				post.mouseover(d);
			})
			.on('mouseout', function(d){
				title.mouseout(d);
				post.mouseout(d);
			})
			.on('click', function(d){
				pdata = data2.filter(function(data){return data.id==d.id})[0];
				post.click(pdata);
			});
	}
	var titles = function(selection){
		selection.each(function(data){
			titleData = getRankedTitles(data);
			series_tit = d3.select('#titlesArea').selectAll('.tit-data').data([titleData]);
			series_tit.enter().append('g').classed('tit-data', true);
			titgroups = series_tit.selectAll('.tit-group')
				.data(titleData, function(d){
					return d.id
				});
			titgroups.enter()
				.append('g')
				.classed('tit-group',true)
			titletext(titgroups);
			titgroups.exit().remove();

		});
	}

	return titles;	
}

/////// SETUP GRAPH STUFF //////
var margin = {top: 20, right: 20, bottom: 30, left: 50},
	width = d3.select('#vizzit').attr('width')-margin.left-margin.right,
	height = d3.select('#vizzit').attr('height')-margin.top-margin.bottom,
	legend_height = 35, titles_width = 150;
var xScale = d3.time.scale(),
	yScale = d3.scale.linear();
var xAxis = d3.svg.axis()
	.scale(xScale)
	.orient('bottom');
var yAxis = d3.svg.axis()
	.scale(yScale)
	.orient('left');
var tl_func = vizzit.timelines()
	.xScale(xScale)
	.yScale(yScale);
var leg_func = vizzit.legend();
var tit_func = vizzit.titles();
//Make svg
var svg = d3.select('#vizzit').classed('chart',true).append('svg')
	.attr('width', d3.select('#vizzit').attr('width'))
	.attr('height', d3.select('#vizzit').attr('height'));
//Make offset group
var g = svg.append('g')
	.attr('transform','translate('+margin.left+','+margin.top+')');
//Make plot area
var plotArea = g.append('g');
plotArea.append('clipPath')
	.attr('id','plotAreaClip')
	.append('rect')
	.attr({width: width-titles_width, height: height+36});
plotArea.attr('clip-path','url(#plotAreaClip)');
//Draw axes
g.append('g')
	.attr('class','x axis')
	.attr('transform','translate(0,'+height+')')
	.call(xAxis);
g.append('g')
	.attr('class','y axis')
	.call(yAxis);
//////////Setup legend stuff////////////
var legChart = d3.select('#vizzit').classed('chart',true).append('svg')
	.classed('legendSVG', true)
	.attr('width', width + margin.left+margin.right)
	.attr('height',legend_height)
	.append('g')
	.classed('legendArea', true)
	.attr('transform','translate('+margin.left+')');
var redrawLegend = function(){
	dataSeries.call(leg_func);
}
/////////Setup nav stuff////////////////
var nav_w = width, nav_h = 75-margin.top-margin.bottom;
var navChart = d3.select('#vizzit').classed('chart',true).append('svg')
	.classed('nav',true)
	.attr('width', nav_w + margin.left+margin.right)
	.attr('height', nav_h+margin.top+margin.bottom)
	.append('g')
	.attr('transform','translate('+margin.left+','+margin.top+')');
var navXscale = d3.time.scale(),
	navXaxis = d3.svg.axis().scale(navXscale).orient('bottom');
//setup viewport stuff for nav area
var viewport = d3.svg.brush()
	.x(navXscale)
	.on('brush', function(){
		xScale.domain(viewport.empty() ? navXscale.domain():viewport.extent())
		redrawChart();
	})
	.on('brushend', function(){
		updateZoomFromChart();
		redrawLegend();
		redrawChart();
	});
//console.log(viewport);
var updateZoomFromChart = function(){
	zoom.x(xScale);
	var fullDomain = time_max - time_min,
		currentDomain = xScale.domain()[1] - xScale.domain()[0];
	var minScale = currentDomain / fullDomain,
		maxScale = minScale * 20;
	zoom.scaleExtent([minScale, maxScale])
}
var redrawChart = function(){
	dataSeries.call(tl_func);
	dataSeries.call(tit_func);
	g.select('.x.axis').call(xAxis);
}


/////// setup zoom stuff ///////
var updateViewportFromChart = function(){
	if ((xScale.domain()[0]<=time_min) && (xScale.domain()[1]>=time_max)){
		viewport.clear();
	}
	else {
		viewport.extent(xScale.domain())
	}
	navChart.select('.viewport').call(viewport);
}
var overlay = d3.svg.area()
	.x(function(d){
			return xScale(d)
			// console.log(xScale.domain())
			// return xScale.domain()[0]
		})
		//function(d){
		//console.log(d.log);
		//return xScale(new Date(d.log.time*1000))})
	.y(function(d){
		return 0;
	})
	.y0(function(d){
		return height;
	})

////// Time and date processing functions //////	
var convertDates = function(data, cb){
	data.forEach(function(d){
		//console.log(d.title);
		if(d.log) {
			d.log.forEach(function(l){
				l.time = new Date(l.time*1000)
			});
		}
	});
	cb(data);
}
var calcTimes = function(data, cb){
	//console.log(data);
		time_max = d3.max(data, function(d){return(d3.max(d.log.map(function(f){return f.time})))}),
		//time_min = d3.min(data, function(d){return(d3.min(d.log.map(function(f){return f.time})))}),
		//hack to only show 12 hrs
		time_min = new Date(time_max-12*60*60*1000);
		rank_max = d3.max(data, function(d){return(d3.max(d.log.map(function(f){return Number(f.rank)})))}),
		rank_min = d3.min(data, function(d){return(d3.min(d.log.map(function(f){return Number(f.rank)})))}),
		time_range = [time_min, time_max];
		cb(data);
}


//get the data and cross them fingers!!
d3.json('/static/core/vizzit/vizzit.json', function(err, data){
	convertDates(data, function(d){
		calcTimes(d, function(data){
			data2 = data;
			var tstart = new Date(time_range[1].getTime()-6*60*60*1000)
			xScale.domain([tstart, time_range[1]]).range([0,width-titles_width]);
			yScale.domain([rank_max, rank_min]).range([height,0]);
			navXscale.domain(time_range).range([0,nav_w]);
			//Make color pallete
			pal = mk_pallete(data.map(function(d){return d.subreddit}));
			//Update axes
			g.select('.x.axis')
				.call(xAxis);
			g.select('.y.axis')
				.call(yAxis);
			//make zoom after xScale has been properly set
			zoom = d3.behavior.zoom()
				.size(width, height)
				.x(xScale)
				//.scaleExtent([.5,2])
				.on('zoom', function(){
					if (xScale.domain()[0]<time_min){
						//console.log(time_min);
						var x = zoom.translate()[0] - xScale(time_min)+xScale.range()[0];
						zoom.translate([x,0]);
					} else if (xScale.domain()[1] > time_max){
						var x = zoom.translate()[0] - xScale(time_max)+xScale.range()[1];
						zoom.translate([x,0]);
					}
					//console.log(zoom.translate());
					redrawChart();
					updateViewportFromChart();
				})
				.on('zoomend', function(){
					redrawLegend();
				});
			//Draw the data???
			plotArea.append('path')
				.attr('class','overlay')
				.attr('d', overlay([time_min, time_max]))
				.call(zoom).on('dblclick.zoom',null);
			dataSeries = plotArea.append('g')
				.attr('transform','translate(0,2)')
				.attr('class','series')
				.datum(data)
				.call(zoom).on('dblclick.zoom',null)
				.call(tl_func)
				.call(leg_func);
			titlesArea = g.append('g')
				.attr('id','titlesArea')
				.attr('transform','translate('+(width-titles_width)+',5)');
			navChart.append('g')
				.attr('class','x axis')
				.attr('transform','translate(0,'+nav_h+')')
				.call(navXaxis);
			navChart.append('g')
				.attr('class','viewport')
				.call(viewport)
				.selectAll('rect')
				.attr('height',nav_h);
			dataSeries.call(tit_func);
			updateViewportFromChart();
		})
	})
});


