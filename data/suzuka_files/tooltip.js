
var secactivepopup={popup:null,layernode:null};
var secpopuptimer=null;
var secpopuptimerover=null;
function buildPopupToolTip(data,left,top){
		
	var popup=element("div",{innerHTML:unescape(data.innerHTML)},{zIndex:"9999",position:"absolute",top:top+"px",left:left+"px",padding:"5px",backgroundColor:"white",border:"1px solid black",textAlign:"left",fontSize:"7pt",minWidth:"200px"});
	popup.onmouseout=function(e){removePopupOnBody(this.parentNode,e);}
	return popup;
}
function mashPopupToolTip(layernode,innerHTML,left,top){
	var offsets=getOffsets(layernode);
	buildPopupOnBody({innerHTML:innerHTML},layernode,buildPopupToolTip,offsets.left+left,offsets.top+top)();
}

function buildPopupOnBody(data,layernode,func,left,top){
	return function(){	
		var appendnode=document.body;
		if(popuptimer)clearTimeout(popuptimer);
		popuptimerover=setTimeout(function(){
			if(activepopup.popup){
				if(activepopup.popup==layernode){
					return;
				}else{
					appendnode.removeChild(activepopup.popup);
					activepopup.popup=null,activepopup.layernode=null;
				}
			}
			
			appendnode.appendChild(activepopup.popup=func(data,left,top));
			activepopup.popup.onmouseover=function(){
				if(popuptimer)clearTimeout(popuptimer);
			};
			activepopup.layernode=layernode;
		},200);
	}
}
function removePopupOnBody(layernode,e){
	var toElement=window.event?window.event.toElement:e.relatedTarget;
	if(popuptimerover)clearTimeout(popuptimerover);
	popuptimer=setTimeout(function(){
		if(activepopup && activepopup.popup && secactivepopup && toElement!=secactivepopup.popup){
			document.body.removeChild(activepopup.popup);
			activepopup.popup=null;
			activepopup.layernode=null;
			if(secactivepopup.popup){
				document.body.removeChild(secactivepopup.popup);
				secactivepopup.popup=null;
				secactivepopup.layernode=null;
			}
		}
	},200);
}

function addTooltip(target, tooltip, offsetX, offsetY) {
	if (!target || !tooltip || tooltip == "") {
		return;
	}
	
	var offX = offsetX || 40;
	var offY = offsetY || -20;
	target.tooltip = tooltip;
	target.onmouseover = function() {
		mashPopupToolTip(this, escape(this.tooltip), offX, offY);
	}
	target.onmouseout = function(event) {
		removePopupOnBody(this,event);
	}

}
	