let width = window.innerWidth;
let height = window.innerHeight;
let data2 = [];

// Map and projection
var path = d3.geoPath();
var projection = d3.geoMercator()
    .scale(110)
    .center([0, 15])
    .translate([width / 2, height / 2 - 70]);

// set data types
var data = d3.map();
var countryLevels = d3.map();
var countryLink = d3.map();

//set color scale
var colorScale = d3.scaleThreshold()
    .domain([1, 2, 3, 4])
    .range(d3.schemeBlues[5]);

// Set popup
var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "#555")
    .attr("id", "toolID")
    .text("hi");

// Load external data and boot
const GEO_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const DATA_URL = "mapData.csv"

//Queue and run the three data vis functions
d3.queue()
    .defer(d3.json, GEO_URL)
    .defer(d3.csv, DATA_URL, function (d) {
        data.set(d.code, +d.num);
        countryLevels.set(d.code, d.countryLevel);
        countryLink.set(d.code, d.link)
        data2.push({ name: d.countryLevel, group: d.num, link: d.link })
    })
    .await(displayData)

function displayData(error, topo) {
    drawMap(error, topo)
    bubbleMap()
    pieChart()
}

function drawMap(error, topo) {
    // Draw the map
    let svg = d3.select("#myChart").append("svg")
        .attr("width", width)
        .attr("height", 730)
        
    svg.append("g")
        .selectAll()
        .data(topo.features)
        .enter()
        .append("path")
  

        // draw each country
        .attr("d", d3.geoPath()
            .projection(projection)
        )
        // set the color of each country
        .attr("fill", function (d) {
            d.total = data.get(d.id) || 0;
            return colorScale(d.total);
        })
        //Country highlight
        .on("mouseover", function (d) {
            d3.selectAll(".Country")
                .transition()
                .duration(200)
                .style("opacity", .2)
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 1)
                .style("stroke", "black")
            tooltip.text(countryLevels.get(d.id)); return tooltip.style("visibility", "visible");
        })
        .on("click", function (d) {
            window.open(countryLink.get(d.id), "_blank");
        })
        .on("mousemove", function () { return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
        .on("mouseout", function () {
            d3.selectAll(".Country")
                .transition()
                .duration(200)
                .style("opacity", .8)
            d3.select(this)
                .transition()
                .duration(200)
                .style("stroke", "transparent")
            return tooltip.style("visibility", "hidden");
        });
}

function bubbleMap() {
    // set the dimensions and margins of the graph
    var width2 = innerWidth
    var height2 = 630 

    // append the svg object to the body of the page
    var svg2 = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", innerWidth)
        .attr("height", height2)

    // A scale that gives a X target position for each group
    var x = d3.scaleOrdinal()
        .domain([1, 2, 3, 4])
        .range([width / 5 + 50, width / 5 * 2 + 50, width / 5 * 3 + 50, width / 5 * 4 + 50])

    // A color scale
    var color = d3.scaleOrdinal()
        .domain([1, 2, 3, 4])
        .range(d3.schemeBlues[4])
 // 

    //draw Bubbles
    var node = svg2.append("g")
        .selectAll("circle")
        .data(data2)
        .enter()
        .append("circle")
        .attr("r", 15)
        .attr("cx", width2 / 2)
        .attr("cy", height2 / 2)
        .style("fill", function (d) { return color(d.group) })
        .style("fill-opacity", 0.8)
        .attr("stroke", "black")
        .style("stroke-width", 4)
        .call(d3.drag() // call specific function when circle is dragged
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        )
        .on("mouseover", function (d) {
            d3.select(this).transition()
                .duration(500)
                .attr("r", 30);
            tooltip.text(d.name);
            tooltip.style("visibility", "visible");
        })
        .on("click", function (d) {
            window.open(d.link, "_blank");
        })
        .on("mousemove", function () {
            return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).transition()
                .duration('500')
                .attr("r", 15);
            return tooltip.style("visibility", "hidden");
        });


    // Features of the forces applied to the nodes:
    var simulation = d3.forceSimulation()
        .force("x", d3.forceX().strength(0.5).x(function (d) { return x(d.group) }))
        .force("y", d3.forceY().strength(0.3).y(height2 / 2))
        //.force("center", d3.forceCenter().x(width2 / 2).y(height2 / 2)) // Attraction to the center of the svg area
        .force("charge", d3.forceManyBody().strength(1)) // Nodes are attracted one each other of value is > 0
        .force("collide", d3.forceCollide().strength(.1).radius(32).iterations(1)) // Force that avoids circle overlapping

    // Apply these forces to the nodes and update their positions.
    // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
    simulation
        .nodes(data2)
        .on("tick", function (d) {
            node
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; })
        });

    // What happens when a circle is dragged?
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(.03).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(.03);
        d.fx = null;
        d.fy = null;
    }
}

function pieChart() {
    // set the dimensions and margins of the graph
    var width3 = innerWidth
    var height3 = 600
    var margin = 40

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = Math.min(width3, height3) / 2 - margin

    // append the svg object to the div called 'my_dataviz'
    var svg3 = d3.select("#my_dataviz2")
        .append("svg")
        .attr("width", width3)
        .attr("height", height3)
        .append("g")
        .attr("transform", "translate(" + width3 / 2 + "," + height3 / 2 + ")");

    // Create dummy data
    var data = { a: 39, b: 28, c: 21, d: 11}
    var data2 = {a: 'Level 1: Exercise Normal Precautions', b:'Level 2: Exercise Increased Caution', c: 'Level 3: Reconsider Travel', d: 'Level 4: Do Not Travel'}
    
    // set the color scale
    var color = d3.scaleOrdinal()
        .domain(data2)
        .range(d3.schemeBlues[5])

    // Compute the position of each group on the pie:
    var pie = d3.pie()
        .value(function (d) { return d.value; })
    var data_ready = pie(d3.entries(data))

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg3
        .selectAll('whatever')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(0)
            .outerRadius(radius)
        )
        .attr('fill', function (d) { return (color(d.data.key)) })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)

        .on("mouseover", function (d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 1)
                .style("stroke", "black")
                console.log
            tooltip.text(data2[d.data.key]); return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function () { return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .style("stroke", "transparent")
            return tooltip.style("visibility", "hidden");
        });

}



