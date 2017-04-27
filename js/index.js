$(function() {
	//播放控制
	var audio = $("audio")[0];
	var lyricArr = [];
	$('.icon-next').click(getSong);
	$('.icon-music').click(getChannels);
	$('.icon-volume-increase').click(increaseVolume);
	$('.icon-volume-decrease').click(decreaseVolume);
	getChannels();
	//获取专辑
	function getChannels() {
		$.ajax({
			url: 'http://api.jirengu.com/fm/getChannels.php',
			dataType: 'json',
			Method: 'get',
			success: function(response) {
				var channels = response.channels;
				var num = Math.floor(Math.random() * channels.length);
				var channelname = channels[num].name; //获取随机频道的名称
				var channelId = channels[num].channel_id; //获取随机频道ID
				$('.record').text(channelname);
				$('.record').attr('title', channelname);
				$('.record').attr('data-id', channelId); //将频道ID计入data-id中
				getSong();
			}
		})
	}

	//获取歌曲
	function getSong() {
		$.ajax({
			url: 'http://api.jirengu.com/fm/getSong.php',
			dataType: 'json',
			Method: 'get',
			data: {
				'channel': $('.record').attr('data-id')
			},
			success: function(data) {
				var resource = data.song[0],
					url = resource.url,
					bgPic = resource.picture,
					sid = resource.sid, //获取歌词的参数
					ssid = resource.ssid, //获取歌词的参数
					title = resource.title,
					author = resource.artist;
				$('audio').attr('src', url);
				$('.lyric').attr('sid', sid);
				$('.lyric').attr('ssid', ssid);
				$('.music-name').text(title);
				$('.music-name').attr('title', title)
				$('.singer').text(author);
				$('.singer').attr('title', author)
				$(".cover").css({
					'background': 'url(' + bgPic + ')',
					'background-repeat': 'no-repeat',
					'background-position': 'center',
					'background-size': 'cover',
				});
				getLyric();
				audio.play();
				$('.btn-status').removeClass('icon-play').addClass('icon-pause');
			}
		})
	}
	setInterval(present, 500) //每0.5秒计算进度条长度
	$(".basebar").mousedown(function(ev) { //拖拽进度条控制进度
		console.log(ev)
		var posX = ev.clientX;
		var targetLeft = $(this).offset().left;
		var percentage = (posX - targetLeft) / 250 * 100;
		audio.currentTime = audio.duration * percentage / 100;
	});

	function present() {
		var length = audio.currentTime / audio.duration * 100;
		$('.progressbar').width(length + '%'); //设置进度条长度
		//自动下一曲
		if (audio.currentTime == audio.duration) {
			getSong();
		}
	}
	$('.btn-status').click(function() {
			if (audio.paused) {
				audio.play();
				$(this).removeClass('icon-play').addClass('icon-pause');
			} else {
				audio.pause();
				$(this).removeClass('icon-pause').addClass('icon-play');
			}
		})
		//获取歌词
	function getLyric() {
		var Sid = $('.lyric').attr('sid');
		var Ssid = $('.lyric').attr('ssid');
		$.post('http://api.jirengu.com/fm/getLyric.php', {
				ssid: Ssid,
				sid: Sid
			})
			.done(function(lyr) {
				var lyr = JSON.parse(lyr),
					lyric = lyr.lyric,
					result = [];
				if (!!lyric) {
					$('.lyric').empty(); //清空歌词信息
					lyricArr = lyric.split('\n'); //歌词为以排数为界的数组
				}
				if (!!lyr.lyric) {
					$('.lyric').empty(); //清空歌词信息
					var line = lyric.split('\n'); //歌词为以排数为界的数组
					var timeReg = /\[\d{2}:\d{2}.\d{2}\]/g; //时间的正则
					var result = [];
					if (line != "") {
						for (var i in line) { //遍历歌词数组
							var time = line[i].match(timeReg); //每组匹配时间 得到时间数组
							if (!time) continue; //如果没有 就跳过继续
							var value = line[i].replace(timeReg, ""); // 纯歌词
							console.log(time);
							for (j in time) { //遍历时间数组
								var t = time[j].slice(1, -1).split(':'); //分析时间  时间的格式是[00:00.00] 分钟和毫秒是t[0],t[1]
								//把结果做成数组 result[0]是当前时间，result[1]是纯歌词
								var timeArr = parseInt(t[0], 10) * 60 + parseFloat(t[1]); //计算出一个curTime s为单位
								result.push([timeArr, value]);
							}
						}
					}
				}
				//时间排序
				result.sort(function(a, b) {
					return a[0] - b[0];
				});
				lyricArr = result;
				renderLyric();

			}).fail(function() {
				$('.lyric').html("<li>本歌曲展示没有歌词</li>");
			})
	}

	function renderLyric() {
		var lyrLi = "";
		for (var i = 0; i < lyricArr.length; i++) {
			lyrLi += "<li data-time='" + lyricArr[i][0] + "'>" + lyricArr[i][1] + "</li>";
		}
		$('.lyric').append(lyrLi);
		setInterval(showLyric, 100);
	}

	function showLyric() {
		var liH = $(".lyric li").eq(5).outerHeight() - 3; //每行高度
		for (var i = 0; i < lyricArr.length; i++) { //遍历歌词下所有的li
			var curT = $(".lyric li").eq(i).attr("data-time"); //获取当前li存入的当前一排歌词时间
			var nexT = $(".lyric li").eq(i + 1).attr("data-time");
			var curTime = audio.currentTime;
			if ((curTime > curT) && (curTime < nexT-1)) { //当前时间在下一句时间和歌曲当前时间之间的时候 就渲染 并滚动
				$(".lyric li").removeClass("active");
				$(".lyric li").eq(i).addClass("active");
				$('.lyric').css('top', -liH * (i - 2));
			}
		}

	}
	//增大音量
	function increaseVolume() {
		if (audio.volume <= 0.9) {
			audio.volume += 0.1;
		}
	}
	//减小音量
	function decreaseVolume() {
		if (audio.volume >= 0.1) {
			audio.volume -= 0.1;
		}

	}
})