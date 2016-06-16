//Libs
var d3 = require('d3');

//Modules
var pcPlot = require('./js/pcPlot.js');

function deletedots(){
    pcPlot.deletedots();
}

function adddots(){
    pcPlot.adddots();
}

d3.select('#deleteButton').on('click', deletedots);
d3.select('#addButton').on('click', adddots);

pcPlot.init();