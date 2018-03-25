var map = null;
var infowindow = null;
var markers = [];
var currentNodeListURL;
var circle = null;
var pingData;
var linkData;
var nodeData;
var markerByIPV6 = new Object();

/*************************
|Initalize the google map
*************************/
function initialize() {

  //Current Node URL with random bits to make sure it doesnt get cached
  currentNodeListURL = document.getElementById('nodeURL').value + '?ramd=' + new Date();


  //Pull Ping Data
  var filePingData = $.getJSON("https://node2.e-mesh.net/ping.json.php", function (data) {
    pingData = data;
  });
  //Pull Link Data
  var fileLinkData = $.getJSON("https://node2.e-mesh.net/links.json.php", function (data) {
    linkData = data;
  });
  var fileNodeData = $.getJSON(currentNodeListURL, function (data) {
    nodeData=data;
  });

  allFiles = $.when(filePingData,fileLinkData,fileNodeData);

  //Set options based on check box positions
  var filterActive = document.getElementById('chkActive').checked;
  var filterProposed = document.getElementById('chkProposed').checked;
  var zoomGroup = document.getElementById('chkGroup').checked;

  //mapStyling from https://mapstyle.withgoogle.com/
  var mapStyle = [
    {
      "elementType": "geometry.fill",
      "stylers": [
        {
          "weight": "2.00"
        }
      ]
    },
    {
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#9c9c9c"
        }
      ]
    },
    {
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "elementType": "labels.text",
      "stylers": [
        {
          "color": "#0e093f"
        },
        {
          "saturation": "0"
        },
        {
          "lightness": "0"
        },
        {
          "visibility": "on"
        },
        {
          "weight": "0.4"
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.neighborhood",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "landscape",
      "stylers": [
        {
          "color": "#f2f2f2"
        }
      ]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#fdfffc"
        }
      ]
    },
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#fdfffc"
        }
      ]
    },
    {
      "featureType": "poi",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road",
      "stylers": [
        {
          "saturation": -100
        },
        {
          "lightness": 45
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#dde9e3"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#7b7b7b"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#ffffff"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "stylers": [
        {
          "visibility": "simplified"
        }
      ]
    },
    {
      "featureType": "transit",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "labels",
      "stylers": [
        {
          "saturation": "0"
        },
        {
          "lightness": "0"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "labels.text",
      "stylers": [
        {
          "weight": "0.51"
        }
      ]
    },
    {
      "featureType": "water",
      "stylers": [
        {
          "color": "#46bcec"
        },
        {
          "visibility": "on"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#c4dfed"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#070707"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#ffffff"
        }
      ]
    }
  ];

  //Prepare default view and create map
  var mapOptions = {
    zoom: 12,
    center: new google.maps.LatLng(43.698136, -79.397593),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    fullscreenControl: false,
    mapTypeControl: true,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM
    },
    styles: mapStyle
  };

  infowindow = new google.maps.InfoWindow({
    content: 'holding...'
  });

  map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);

  //Resize markers based on zoom size
  google.maps.event.addListener(map, 'zoom_changed', function () {
    ZoomMarkers();
  });

  //Reset markers array
  markers = undefined;
  markers = [];


  allFiles.done(function () {

    var nodeVisible;
    var data=nodeData;
    //loop through each node
    for (var key in data) {
      var results = data[key];

      //console.log(results);
      nodeVisible = 1; //Default all nodes to visible

      //Adjust visibility based on value and option variable
      if (results['status'] == 'active' && !filterActive) nodeVisible = 0;
      if (results['status'] == 'proposed' && !filterProposed) nodeVisible = 0;

      if (nodeVisible) {
        //prepare location point
        var lat = results['latitude'];
        var lng = results['longitude'];
        var myNodeLatLng = new google.maps.LatLng(lat, lng);
        var myNodeName = results['name'];
        //Call function to create (or update) marker
        var newNode = addMarker(map, results, myNodeName, myNodeLatLng);

        //If new node was created (rather then updated) add it to the marker array
        if (newNode)
          markers.push(newNode);
      }
    }

    //Clustering code to group markers that are very close together untill you zoom in (if option enabled)
    if (zoomGroup) {
      var mcOptions = {
        gridSize: 20,
        maxZoom: 15,
        imagePath: '/images/map/m'
      };
      var mc = new MarkerClusterer(map, markers, mcOptions);
    }
    //Load Links
    LoadLinks();
  });
}
function LoadLinks() {
  for (var key in linkData) {
    m1 = [linkData[key]['from']];
    m2 = [linkData[key]['to']];
    m1 = markerByIPV6[m1];
    m2 = markerByIPV6[m2];
    if (m1 && m2) {
      var color = "#00ff00";

      //Manually defiened "datacenter" peers
      if (
        linkData[key]['from'] == 'fc4d:c8e5:9efe:9ac2:8e72:fcf7:6ce8:39dc' ||
        linkData[key]['to'] == 'fc4d:c8e5:9efe:9ac2:8e72:fcf7:6ce8:39dc' |
        linkData[key]['from'] == 'fc6e:691e:dfaa:b992:a10a:7b49:5a1a:5e09' ||
        linkData[key]['to'] == 'fc6e:691e:dfaa:b992:a10a:7b49:5a1a:5e09' ||
        linkData[key]['to'] == 'fcaa:5785:a537:90db:6513:bba9:87a0:12a7' ||
        linkData[key]['from'] == 'fcaa:5785:a537:90db:6513:bba9:87a0:12a7') {

        color = "#FFA323";
      }

      //Draw lines for active links
      var line = new google.maps.Polyline({
        path:
          [
            new google.maps.LatLng(m1.position.lat(), m1.position.lng()),
            new google.maps.LatLng(m2.position.lat(), m2.position.lng())
          ],
        strokeColor: color,
        strokeOpacity: .3,
        strokeWeight: 2,
        map: map
      });
      line.setMap(map);
    }
  }
}

//Function to find a marker witth a specific lat lng and dir combo.  
//Used so that we don't create a new marker but rather add info to the existing one.
function findMarker(lat, lng, dir) {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i].position.lat() == lat &&
      markers[i].position.lng() == lng &&
      markers[i].direction == dir) {
      return markers[i];
    }
  }
  return undefined;
}

//function to add data to map
//Tries to find marker that already exists
//Otherwise creates a new one
function addMarker(map, nodeResult, name, location) {

  //Specify the colour of the marker based on the status
  var nodeColor;
  if (nodeResult['status'] == 'active') {
    nodeColor = 'green';
  }
  if (nodeResult['status'] == 'proposed') {
    nodeColor = 'grey';
  }

  //Default to OMNI icon if no direction is given
  var ArrowDirection = 'omni';

  //If direction is given set it to the correct direction
  if (nodeResult['cardinalDirection'] != null) ArrowDirection = nodeResult['cardinalDirection'];
  if (nodeResult['cardinalDirectionAntenna'] != null) ArrowDirection = nodeResult['cardinalDirectionAntenna'];

  //Return formatted date for display
  var formattedDate = function () {
    var date = new Date(nodeResult['dateAdded']);
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  //Proper case noteStatus
  var nodeStatus = nodeResult['status'].charAt(0).toUpperCase() + nodeResult['status'].slice(1);

  //Prepare the detail information for the marker
  var Description = '';
  Description = '<div class="markerPop">';
  Description += '<h1>' + name + '</h1>';
  Description += '<p>Status: ' + nodeStatus + '</p>';
  if (nodeResult['cardinalDirection']) Description += '<p>Direction: ' + nodeResult['cardinalDirection'] + '</p>';
  if (nodeResult['cardinalDirectionAntenna']) Description += '<p>Antenna Direction: ' + nodeResult['cardinalDirectionAntenna'] + '</p>';
  if (nodeResult['floor']) Description += '<p>Floor: ' + nodeResult['floor'] + '</p>';
  if (nodeResult['IPV6Address']) Description += '<p>IPV6: ' + nodeResult['IPV6Address'] + '</p>';
  Description += '<p>Added: ' + formattedDate() + '</p>';

  //Hopefully ping data is loaded by now!
  if (pingData != undefined) {
    //If there is an IPV6 Address
    if (nodeResult['IPV6Address']) {
      //If there is data in the ping file for this address
      if (pingData[nodeResult['IPV6Address']]) { 
        //If the node is alive
        if (pingData[nodeResult['IPV6Address']]['status'] == 'ok') {

          Description += '<p>State: ONLINE</p>';
          Description += '<p>RTT: ' + pingData[nodeResult['IPV6Address']]['pingAvg'] + '</p>';
          Description += '<p>Check: ' + pingData[nodeResult['IPV6Address']]['lastPing'] + '</p>';
          Description += '<p><a href="#" onclick="Grafana(\'' + nodeResult['IPV6Address'] + '\',this); return false">Stats</a></p>';
        //If the node is not alive
        } else {
          Description += '<p>State: DOWN</p>';
          nodeColor = 'red';
        }
      //If there is no data for this node in the file
      } else {
        Description += '<p>State: No Data</p>';
        nodeColor = 'red';
      }
    }
  }
  Description += '</div>';

  //Check to see if the currenty direction,lat,lng combo exists
  var marker = findMarker(location.lat(), location.lng(), ArrowDirection);

  //Prepare the image used to display the direction arrow and node color
  var IMG = '/images/map/arrow-' + ArrowDirection.toLowerCase().replace(' ', '') + '-' + nodeColor + '.png';

  //If marker does not exists in position and direction, create it
  if (marker == undefined) {

    //Establish anchor point based on direction of arrow so arrow images dont overlap each other so that they dont fully overlap
    var x = 16;
    var y = 16;
    switch (ArrowDirection) {
      case 'North':
      case 'North East':
      case 'North West':
        y = 32;
        break;
      case 'South':
      case 'South East':
      case 'South West':
        y = 0;
        break;
    }
    switch (ArrowDirection) {
      case 'East':
      case 'North East':
      case 'South East':
        x = 0;
        break;
      case 'West':
      case 'North West':
      case 'South West':
        x = 32;
        break;
    }

    var imageAnchor = new google.maps.Point(x, y);

    //Create a new marker
    marker = new google.maps.Marker({
      position: location,
      map: map,
      title: name,
      icon: {
        url: IMG,
        anchor: imageAnchor,
        anchorOrig: imageAnchor,
      },
      direction: ArrowDirection,
      html: Description
    });

    //Add listener to the marker for node click
    google.maps.event.addListener(marker, 'click', function () {

      //Code adds a circle to identiy selected marker and 
      //Maybe even present a possible range
      if (typeof infowindow != 'undefined') infowindow.close();
      infowindow.setContent(this.html);
      infowindow.open(map, this);

      if (circle) {
        circle.setMap(null);
      }

      // Add circle overlay and bind to marker
      circle = new google.maps.Circle({
        map: map,
        radius: 20, // 10 miles in metres
        fillColor: '#AA0000'
      });
      circle.bindTo('center', marker, 'position');


    });
    //listner to close window
    google.maps.event.addListener(map, 'click', function () {
      infowindow.close();
    });

    //Returns marker to identify it was created not modified
    markerByIPV6[nodeResult['IPV6Address']] = marker;
    return marker;

  //If marker already exists in direction and position, just add more information to the existing one.
  } else {
    markerByIPV6[nodeResult['nodeResult']] = marker;
    if (marker.icon.url != IMG) {

      //Promote marker if new status is better then the previouse one
      //IE: if inactive and new item is active set the node color to green

      //Update marker color if an active node exists in the "stack"
      var markerLevel = 0;
      if (marker.icon.url.search('-red.png') > 0) markerLevel = 1;
      if (marker.icon.url.search('-green.png') > 0) markerLevel = 2;
      var requestLevel = 0;
      if (IMG.search('-red.png') > 0) requestLevel = 1;
      if (IMG.search('-green.png') > 0) requestLevel = 2;
      if (requestLevel > markerLevel) {
        marker.icon.url = IMG;
      }

    }

    //Update marker
    marker.html = marker.html + Description;
    markerByIPV6[nodeResult['IPV6Address']] = marker;
    return undefined;
  }
}


/*******************
 Custom Marker Code
********************
Functions that deal with dialog box interaction
Including GeoCoding and JSON Generation
*/

var customMarker = undefined;

//Plot new custom marker from entered coordinates
function addCustomMarker() {
  var lng = document.getElementById('customMarkerLng').value;
  var lat = document.getElementById('customMarkerLat').value;

  //If custom marker already exists use it
  if (customMarker) {
    customMarker.setPosition(new google.maps.LatLng(lat, lng));
  //If custom marker does not exist, create one 
  } else {
    var location = new google.maps.LatLng(lat, lng);
    customMarker = new google.maps.Marker({
      position: location,
      map: map,
      title: 'New Location',
      draggable: true
    });

    //Event for marker after it has been dropped (end of drag and drop)
    google.maps.event.addListener(customMarker, 'dragend', function () {
      document.getElementById('customMarkerLng').value = customMarker.getPosition().lng();
      document.getElementById('customMarkerLat').value = customMarker.getPosition().lat();
      customMarkerGenerateJSON(); //Regenerate json data in case your looking at the json screen
    });
  }
  //Center map around new marker
  map.setCenter(new google.maps.LatLng(lat, lng));
}

//Attempt to GeoCode the marker based on an address
function customMarkerGeoCode() {
  var address = document.getElementById('customMarkerAddress').value;
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({
    'address': address
  }, function (results, status) {
    if (status == 'OK') {

      document.getElementById('customMarkerLng').value = results[0].geometry.location.lng();
      document.getElementById('customMarkerLat').value = results[0].geometry.location.lat();
      map.setCenter(results[0].geometry.location);
      addCustomMarker(document.getElementById('customMarkerLat').value, document.getElementById('customMarkerLng').value);
      $('div#customMarkerGeoCodeDiv').hide();
      $('div#customMarkerLocationDiv').show();
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

//Show Json dialog box
function customMarkerShowJsonDialog() {
  $('div#customMarkerJSONDiv').show();
  $('div#customMarkerLocationDiv').hide();
  customMarkerGenerateJSON();
}

//Updates the text for the JSON data on the JSON screen
function customMarkerGenerateJSON() {

  var lng = document.getElementById('customMarkerLng').value;
  var lat = document.getElementById('customMarkerLat').value;
  var floor = document.getElementById('customMarkerFloor').value;
  var dir = document.getElementById('customMarkerDirection').value;
  var name = document.getElementById('customMarkerName').value;

  var currentJSONDate = (new Date()).toJSON();

  var sJSON = '<div class="box-header"><h2>JSON for node</h2></div><pre style="white-space: pre;margin-bottom:10px;">,\n   {\n' +
    '      "name": "' + name + '",\n' +
    '      "latitude": ' + lat + ',\n' +
    '      "longitude":' + lng + ',\n' +
    '      "cardinalDirection": "' + dir + '",\n' +
    '      "floor": ' + floor + ',\n' +
    '      "status": "proposed",\n' +
    '      "dateAdded": "' + currentJSONDate + '"\n' +
    '   }\n</pre>';

  document.getElementById('customMarkerJSONDiv').innerHTML = sJSON + '<input type="button" value="Start Over" onclick="clearWindows();" />';


}
//Use browser location to map point
function GeoLocationBrowser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showGeoLocatedPosition);
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}

//Manual positioning of custom marker
function showGeoLocatedPosition(position) {
  document.getElementById('customMarkerLng').value = position.coords.longitude;
  document.getElementById('customMarkerLat').value = position.coords.latitude;
  addCustomMarker();
}

function clearWindows() {
  //$("div.customMarker").hide();
  $('div#customMarkerLocationDiv').hide();
  $('div#customMarkerJSONDiv').hide();

  $('div#customMarkerGeoCodeDiv').show();
  $('div#customMarkerAddress').show();

  document.getElementById('customMarkerLng').value = -79.397593;
  document.getElementById('customMarkerLat').value = 43.678136;

  document.getElementById('customMarkerFloor').value = '';
  document.getElementById('customMarkerDirection').value = '';
}

//Option Window Code
function ShowAdvanced(what) {
  if (what.innerHTML == '+Show Advanced') {
    $('div#customAdvacned').show();
    what.innerHTML = '-Hide Advanced';
  } else {
    $('div#customAdvacned').hide();
    what.innerHTML = '+Show Advanced';
  }
}

//Expand Option Window For Mobile
function optionExpand() {
  if ($('#mapOptions').hasClass('FullHeight')) {
    $('#mapOptions').removeClass('FullHeight');
  } else {
    $('#mapOptions').addClass('FullHeight');
  }
}


function ZoomMarkers() {

  var SizeOffset = 32 - (12 * 4);
  newSize = ((map.getZoom() * 4) + SizeOffset);

  //	document.title=s + " " + map.getZoom();
  for (var i = 0; i < markers.length; i++) {

    setSize = newSize;

    //Dont allow size to grow past 32
    if (setSize > 32) setSize = 32;

    var currentIcon = markers[i].getIcon();
    currentIcon.scaledSize = new google.maps.Size(setSize, setSize);

    var imageAnchor = currentIcon.anchorOrig;

    if (newSize > 32) {
      currentIcon.anchor = a.anchorOrig; //imageAnchorNEW;
    } else {

      var delta = (32 - newSize) / 2;

      var imageAnchorX = a.anchorOrig.x - delta;
      var imageAnchorY = a.anchorOrig.y - delta;
      var imageAnchorNEW = new google.maps.Point(imageAnchorX, imageAnchorY);
      currentIcon.anchor = imageAnchorNEW;
    }

    markers[i].setIcon(a);
  }
  return undefined;
}
google.maps.event.addDomListener(window, 'load', initialize);


//Show grafana graph
function Grafana(ip, where) {
  v2 = encodeURI("[" + ip + "]:9100");
  link = '<iframe scrolling="no" src="http://node2.e-mesh.net:3000/dashboard-solo/db/mesh-node-metrics-fixed?panelId=12&fullscreen&var-node=' + v2 + '&theme=light" height="200" frameborder="0"></iframe>';
  where.parentElement.innerHTML = link;
}