'use strict';

/** Opens new tab with google maps, opened at the place the photo was taken */
function getClickHandler(info, tab) {
  chrome.tabs.executeScript(tab.id, {code: '' +
    'var lat = null;' +
    'var lon = null;' +
    'for(var i = 0; i < document.images.length; ++i) {' +
    '   if(document.images[i].src === "' + info.srcUrl + '") {' +
    '      lat = document.images[i].getAttribute("data-gps-latitude-pretty");' +
    '      lon = document.images[i].getAttribute("data-gps-longitude-pretty");' +
    '      break;' +
    '   }' +
    '}' +
    'chrome.runtime.sendMessage({method:"showLocation",lat:lat,lon:lon});'
  });
}

/** Create a context menu which will only show up for images and selections. */
var showMapItem = chrome.contextMenus.create({
  'title' : chrome.i18n.getMessage('menuItemCaption'),
  'type' : 'normal',
  'contexts' : ['image'],
  'onclick' : getClickHandler
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	switch(message.method) {
		case 'showLocation':
			// https://www.google.com/maps/place/41°22'52.0'N+2°07'12.0'E
			if(message.lat && message.lon) {
				chrome.tabs.create( { url: 'https://www.google.com/maps/place/' + message.lat + '+' + message.lon } );
			}
			break;
		case 'updateMenu':
			chrome.contextMenus.update(showMapItem, {enabled: 'true' === message.hasmap});
			break;
		case 'getAddressByLatLng':
			var url = 'http://geocode-maps.yandex.ru/1.x/?lang=en-US&format=json&geocode='+message.lat+','+message.lon;
			var xmlHttpReq = new XMLHttpRequest();
			if(xmlHttpReq) {
				xmlHttpReq.open('GET', url);
				xmlHttpReq.onreadystatechange = function () {
					if(xmlHttpReq.readyState === 4 && xmlHttpReq.status === 200) {
						sendResponse( { results: xmlHttpReq.responseText } );
					}
				};
				xmlHttpReq.send(null); // We pass 'null' to send because we are using 'GET'
			}
			break;
	}
	return true;
});
