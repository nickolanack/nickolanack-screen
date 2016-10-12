var events = require('events');

function BroadcastQueue(options) {

	var me = this;
	events.EventEmitter.call(me);

	me.queue=[];

	setInterval(function(){

		if(me.queue.length){

			//console.log('queue: '+me.queue.length);

			var current=me.queue[0];
			var name=current[0];
			var fn=current[1];

			//console.log('name: '+name);

			var len=me.queue.length;
			var last=null;
			for(var i=0;i<len;i++){

				var p=len-(i+1);
				if(me.queue[p][0]===name){
					
					if(!last){
						last=me.queue[p];
					}else{
						//console.log('discard: '+name+' at '+p);
					}
					me.queue.splice(p, 1);


				}

			}

			if(last){
				last[1]();
			}else{
				fn();
			}


		}


	}, 1000/100);

}

BroadcastQueue.prototype.__proto__ = events.EventEmitter.prototype;

BroadcastQueue.prototype.add = function(name, fn) {
	var me=this;
	me.queue.push([name, fn]);


};

module.exports = BroadcastQueue;