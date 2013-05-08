// Comment or uncomment this for production / dev
//console.log = function(){};
var cachingData = new function () {
    // Constants:
    var LAST_CHECKED = "lastChecked",
        CACHED_DRIBBLE_DATA = "cachedDribbbleData",
        USERNAME = "username";

    var storageAPI = window.localStorage,
        self = this;

    self.getLastTimeChecked = function () {
        return storageAPI.getItem(LAST_CHECKED) ? new Date(storageAPI.getItem(LAST_CHECKED)) : null;
    };

    self.getCachedShots = function () {
        return storageAPI.getItem(CACHED_DRIBBLE_DATA) ? JSON.parse(storageAPI.getItem(CACHED_DRIBBLE_DATA)) : null;
    };

    self.getUsername = function () {
        return storageAPI.getItem(USERNAME);
    };

    self.setLastChecked = function (date) {
        console.log("Updating last checked", date);
        storageAPI.setItem(LAST_CHECKED, date);
    };

    self.setCachedShots = function (jsonData) {
        // console.log("Updating cached shots", jsonData);
        storageAPI.setItem(CACHED_DRIBBLE_DATA, jsonData);
    };

    self.setUsername = function (username) {
        console.log("Updating username", username);
        storageAPI.setItem(USERNAME, username);
    };

    // clears all the local storage items:
    self.clearCache = function () {
        console.log("clearing cache");
        storageAPI.clear();
    };
};

var showing = 0,
    user = $('#lookup-player'),
    userName = cachingData.getUsername(),
    shotcount = 12,
    page = 1,
    current = localStorage.getItem('current');

var drib = {
    host:'http://api.dribbble.com',
    popular:'/shots/popular',
    everyone:'/shots/everyone',
    debuts:'/shots/debuts',
    player:'/players/',
    shot:'/shots/',

    /* ================================
     Rewriting call function
     =================================*/

    add:function (page, from, how) {
        console.log('page ' + page)
        if (from === 'popular') {
            var url = drib.host + drib.popular + "?per_page=" + shotcount + "&page=" + page;
            console.log('####' + url);
            var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + url + '"') + '&format=json&callback=cbfunc';
        } else if (from === 'debuts') {
            var url = drib.host + drib.debuts + "?per_page=" + shotcount + "&page=" + page;
            var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + url + '"') + '&format=json&callback=cbfunc';
            console.log('####' + url);
        } else if (from === 'everyone') {
            var url = drib.host + drib.everyone + "?per_page=" + shotcount + "&page=" + page;
            var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + url + '"') + '&format=json&callback=cbfunc';
            console.log('####' + url);
        } else {
            playerId = from;
            if (how === 'new') {
                $('.subInfo').show().html("<span style='color:#68a4f5'>searching...<span>");
            }
            var url = drib.host + drib.player + playerId + '/shots/following' + "?per_page=" + shotcount + "&page=" + page;
            console.log('####' + url);
            var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + url + '"') + '&format=json&callback=cbfunc';
        }
        this.req(yql, function (data) {
//            console.log('how:'+ how);
            getShots.buildShots(data.query.results.json.shots, how);
        });
    },

    req:function (url, cbfunc) {
        /*var lastTimeChecked = cachingData.getLastTimeChecked(),
         cachedData = cachingData.getCachedShots(),
         toCheckTime = new Date(),
         userName = cachingData.getUsername();

         // cache once every 5 minutes:
         toCheckTime.setMinutes(toCheckTime.getMinutes() - 5);

         // Only call api if the data hasn't been cached or input has changed:
         if (!lastTimeChecked || (lastTimeChecked > toCheckTime) || userName !== user.val()) {
         cachingData.setUsername(user.val());
         $.ajax({
         url:url,
         dataType:'jsonp',
         jsonp:false,
         jsonpCallback:'cbfunc',
         timeout:1000,
         success:function (data) {
         cachingData.setLastChecked(new Date());
         cachingData.setCachedShots(JSON.stringify(data));

         OnSuccess(data);
         },
         error:function (x, t, m) {

         if (t === "timeout") {
         drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
         console.log('timeout error');
         drib.getPopular();
         } else {
         $('#lookup-player').addClass('error');
         console.log('else timeout error');
         drib.getPopular();
         }
         }
         });
         }
         else {
         // call on succes with cached data:
         console.log('cached data');
         OnSuccess(cachedData);
         } */
        $.ajax({
            url:url,
            dataType:'jsonp',
            jsonp:false,
            jsonpCallback:'cbfunc',
            timeout:15000,
            success:function (data) {
                cachingData.setLastChecked(new Date());
                cachingData.setCachedShots(JSON.stringify(data));
                /*if (data.query.results.message && data.query.results.message == 'Not found') {
                 drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
                 console.log('timeout error');
                 window.localStorage.setItem('username', '');
                 window.localStorage.setItem('load', 'popular');
                 window.localStorage.setItem('current', 'popular');
                 page = 1;
                 drib.add(page, 'popular', 'new');
                 return;
                 }*/
                OnSuccess(data);
            },
            error:function (x, t, m) {
                if (t === "timeout") {
                    drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
                    console.log('timeout error');
                    //window.localStorage.setItem('username', '');
                    //window.localStorage.setItem('load', 'popular');
                    //window.localStorage.setItem('current', 'popular');
                    //page = 1;
                    //drib.add(page, 'popular', 'new');
                    return;
                } else {
                    $('#lookup-player').addClass('error');
                    drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
                    console.log('else timeout error');
                    --page;
                    //window.localStorage.setItem('username', '');
                    //window.localStorage.setItem('load', 'popular');
                    //window.localStorage.setItem('current', 'popular');
                    //page = 1;
                    //drib.add(page, 'popular', 'new');
                    return;
                }
            }
        });

        function OnSuccess(data) {
            var userName = cachingData.getUsername();
            $('.subInfo').hide();
            cbfunc(data);
        }
    },

    showError:function (errorMessage) {
        // data is tainted so clear cache:
        //cachingData.clearCache();

        $('#lookup-player').removeClass('playerList').addClass('error');
        $('.subInfo').html("<span style='color:#ce4d73'>" +
            errorMessage +
            "<span>");
    },

    settings:function (tog, cl) {
        if (tog == 'in') {
            if (cl == 'signin') {
                $(".settings").addClass('active');
            } else {
                $(".settings").addClass('active').siblings().removeClass('active');
            }
            $('.subInfo').hide();
            $(".settingsPop").fadeIn(250);
            $(".overlay").fadeIn(250);
            $('#picsList').addClass('blur');
            $(".settingsPop").removeClass('out').addClass('in').show();
        }
        if (tog == 'out') {
            $('.subInfo').hide();
            $(".settingsPop").delay(150).fadeOut(250);
            $('#picsList').removeClass('blur');
            $('.overlay').fadeOut(100);
            $(".settingsPop").removeClass('in').addClass('out');

            drib.activeNav();
        }
    },
    userNav:function (tog) {
        if (tog == 'following') {
            $('#self').html('Following').addClass('following').removeClass('signIn');
        }
        if (tog == 'signin') {
            $('#self').html('Sign In').addClass('signIn').removeClass('following');
        }
    },
    activeNav:function () {
        var navli = $('.nav li');
        navli.each(function () {
            //console.log('current:'+ current);
            //console.log('id:' +$(this).attr("id"));
            if ($(this).attr('id') == current) {
                $($(this)).addClass('active').siblings().removeClass('active');
            } else {
                $('.following').addClass('active').siblings().removeClass('active');
            }
        });
    }
};


var getShots = {
    container:$('#picsList'),
    buildShots:function (shots, how) {
        var imgs = '';
        for (var i = 0; i < shotcount && shots && i < shots.length; i++) {
            //console.log(shots[i]);
            if (shots[i].image_400_url) {
                var shotsImg = shots[i].image_400_url;
            } else {
                var shotsImg = shots[i].image_url;
            }
            imgs += '<div class="animate fadeInUp item">' +
                //  style="-webkit-animation-delay: ' + i * 150 + 'ms;" <!-- animation styles
                '    <div class="picture" style="background-image:url(' + shotsImg + ');">' +
                //'        <img class="shot" src="' + shots[i].image_url + '" />' +
                '       <div class="gradient"><a class="link" href="' + shots[i].url + '"></a></div>' +
                '        <div class="underlay">' +
                //'            <a class="r round" href="' + shots[i].url + '"><img src="css/img/arrow.png" /></a>' +
                '            <a class="i round" href="' + shots[i].player.url + '"><img src="' + shots[i].player.avatar_url + '" /></a>' +

                '           <div class="shotStats">' +
                '              <span class="name"><a href="' + shots[i].player.url + '">' + shots[i].player.name + '</a></span>' +
                '              <span class="likes">' + shots[i].likes_count + ' Likes &middot; ' + shots[i].comments_count + ' comments</span>' +
                '           </div>' +
                '        </div>' +
                '    </div>' +
                '</div>';
        }
        //       console.log('how:'+ how);
        if (how === 'new') {
            this.container.html(imgs);
        } else {
            this.container.append(imgs);
        }

        //insert add into a random position 2 per 20
        var minRand = 3;
        var maxRand = 12;
        var ad = 'CK7IP';

        //var min2Rand = 14;
        //var max2Rand = 20;
        //var ad2 = 'CVYI6';

        var injectAd = function (min, max, ad) {
            var rand = Math.random(); //return a decimal between 0 and 1
            var randSpan = rand * (max - min);
            var floor = Math.floor(randSpan);
            var pos = floor + min + ((page - 1) * 20);

            //console.log('inject ad');

            // Insert Add Code Here
            $.ajax({
                type:'get',
                url:'https://srv.buysellads.com/ads/' + ad + '.json',
                success:Success,
                error:Error,
                dataType:'jsonp'
            });
            function Success(res) {

                console.log(res);

                /*if (!res.ads[0].shotId) {
                 _gaq.push(['_trackEvent', 'ad', 'api no response', ad]);
                 return;
                 }*/

                var adId = res.ads[0].shotId,
                    clickUrl = res.ads[0].statlink_default,
                    clickId = clickUrl.substring(clickUrl.lastIndexOf('/') + 1),
                    shotUrl = drib.host + drib.shot + adId,
                    yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + shotUrl + '"') + '&format=json&callback=cb',
                    html = res.ads[0].html;


                //console.log('AD ####'+ shotUrl);


                $.ajax({
                    url:yql,
                    dataType:'jsonp',
                    jsonp:true,
                    jsonpCallback:'cb',
                    timeout:1000,
                    success:function (data) {
                        console.log(data);
                        var shotStr = data.query.results.json,
                            singleShot = '';
                        /*if(shotStr.image_400_url) {
                         var shotsImg = shotStr.image_400_url;
                         } else {
                         var shotsImg = shotStr.image_url;
                         }
                         singleShot += '<div class="animate fadeInUp item featured" data-clickid="'+clickId+'" data-shotId="'+ adId +'">' +
                         '    <span class="featured"></span>' +
                         '    <div class="picture" style="background-image:url('+ shotsImg +');">' +
                         //'        <img class="shot" src="' + shots[i].image_url + '" />' +
                         '       <div class="gradient"><a class="link" href="' + shotStr.url + '"></a></div>' +
                         '        <div class="underlay">' +
                         //'            <a class="r round" href="' + shots[i].url + '"><img src="css/img/arrow.png" /></a>' +
                         '            <a class="i round" href="' + shotStr.player.url + '"><img src="' + shotStr.player.avatar_url + '" /></a>' +

                         '           <div class="shotStats">' +
                         '              <span class="name"><a href="' + shotStr.player.url + '">' + shotStr.player.name + '</a></span>' +
                         '              <span class="likes">' + shotStr.likes_count + ' Likes &middot; '+ shotStr.comments_count +' comments</span>' +
                         '           </div>' +
                         '        </div>' +
                         '    </div>' +
                         '</div>';
                         console.log(pos);
                         $('#picsList div:nth-child('+ pos +')').after(singleShot);
                         _gaq.push(['_trackEvent', 'ad', 'populated ad', adId]);*/
                        //console.log(html);
                        singleShot += '' + html + '<div id="ad" class="animate fadeInUp item"><div id="fusion_ad" data-clickid="' + clickId + '">' +
                            '       <a class="poweredBy" href="http://fusionads.net">Powered by Fusion</a>' +
                            '   </div>';
                        '</div>';
                        //$('#picsList div:nth-child('+ pos +')').after(singleShot);
                        console.log('oh high');
                        $('#picsList div:nth-child(' + 3 + ')').after(singleShot);
                        _gaq.push(['_trackEvent', 'ad', 'populated ad', adId]);


                    },
                    error:function (x, t, m) {
                        return;
                    }

                    /*InstaAPI.getFeedItem(adId, function (res) {
                     mainViewModel.feedItems.splice(pos, 0, res);
                     $('#picsList li').eq(pos).attr('data-clickid', clickId).addClass('featured');
                     _gaq.push(['_trackEvent', 'ads', 'api called', ad]);
                     });*/
                });
            }

            function Error(response) {
                console.log('calling error', response);

            }
        };

        console.log('call ad injection' + page);
        if (page === 1) {
            injectAd(minRand, maxRand, ad);
        }
    }
};

var ui = {
    init:function () {
        /*user.bind('blur keyup', function (event) {
         if (event.type === 'keyup' && event.keyCode !== 13 && event.keyCode !== 10) return;

         // clear cache so that the data is refreshed:
         cachingData.clearCache();

         var val = $(this).val();
         if (val == 'debuts') {
         window.localStorage.setItem('load', $(this).val());
         drib.getDebuts();
         return;
         } else if (val == 'everyone') {
         window.localStorage.setItem('load', $(this).val());
         drib.getEveryone();
         return;
         } else if (val == 'popular') {
         window.localStorage.setItem('load', $(this).val());
         drib.getPopularNoError();
         return;
         } else if (val == '') {
         console.log('setting user to blank');
         window.localStorage.setItem('load', $(this).val());
         drib.getPopular();
         return;
         }

         window.localStorage.setItem('load', $(this).val());
         drib.getFollowing($(this).val());
         });*/

        /*if (userName !== null && userName !== '') {
         user.val(userName);
         if (userName == 'debuts') {
         drib.getDebuts();
         return;
         } else if (userName == 'everyone') {
         drib.getEveryone();
         return;
         } else if (userName == 'popular') {
         drib.getPopularNoError();
         return;
         } else {
         console.log('getFollowing');
         drib.getFollowing(userName);
         return;
         }
         } else {
         drib.add(0, 'popular');
         window.localStorage.setItem('load', 'popular');
         }*/
        $('.nav li').on('click', function () {
            var from = $(this).attr("id");

            // Highlight Active Nav Item
            $(this).addClass('active').siblings().removeClass('active');

            // Show Login if user needs to sign in
            if (from === 'self' && $(this).hasClass('signIn')) {
                drib.settings('in', 'signin');
                return;
            } else if (from === 'self' && $(this).hasClass('following')) {
                console.log('userName' + userName);
                from = userName;
            }
            if (from === 'settings') {
                return;
            }

            window.localStorage.setItem('current', from);
            $("html, body").animate({ scrollTop:0 }, 600);
            //window.localStorage.setItem('load', from);
            page = 1;
            drib.add(page, from, 'new');
        });

        user.bind('blur keyup', function (event) {
            if (event.type === 'keyup' && event.keyCode !== 13 && event.keyCode !== 10) return;
            if (!$(this).val()) {
                window.localStorage.setItem('username', '');
                window.localStorage.setItem('load', 'popular');
                window.localStorage.setItem('current', 'popular');
                drib.userNav('signin');
                drib.add(page, 'popular', 'new');
            } else {
                var playerId = $(this).val();
                $('.subInfo').show().html("<span style='color:#68a4f5'>searching...<span>");
                var url = drib.host + drib.player + playerId + '/shots/following';
                var yql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from json where url="' + url + '"') + '&format=json&callback=cbuser';
                console.log('####' + yql);
                $.ajax({
                    url:yql,
                    dataType:'jsonp',
                    jsonp:true,
                    jsonpCallback:'cbuser',
                    timeout:1000,
                    success:function (data) {
                        if (data.query.results.message === "Not found") {
                            $('#lookup-player').addClass('error');
                            drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
                            window.localStorage.setItem('username', '');
                            window.localStorage.setItem('load', 'popular');
                            window.localStorage.setItem('current', 'popular');
                            drib.userNav('signin');
                            page = 1;
                            drib.add(page, 'popular', 'new');
                            return;
                        }
                        console.log(playerId);
                        window.localStorage.setItem('username', playerId);
                        window.localStorage.setItem('load', playerId);
                        window.localStorage.setItem('current', playerId);
                        console.log(userName);
                        drib.userNav('following');
                        page = 1;
                        drib.add(page, playerId, 'new');

                    },
                    error:function (x, t, m) {
                        $('#lookup-player').addClass('error');
                        drib.showError("We're sorry, we couldn't find that username.  We'll show you the popular shots in the meantime");
                        window.localStorage.setItem('username', '');
                        window.localStorage.setItem('load', 'popular');
                        window.localStorage.setItem('current', 'popular');
                        drib.userNav('signin');
                        page = 1;
                        drib.add(page, 'popular', 'new');
                        return;
                    }
                });
            }
        });

        //On load 
        user.val(userName);
        /*if (!userName) {
         window.localStorage.setItem('current', 'popular');
         } else {
         window.localStorage.setItem('current', userName);
         }*/
    }
};

$(function () {
    //console.log('initialize');
    ui.init();

    if (!userName) {
        window.localStorage.setItem('current', 'popular');
        drib.userNav('signin');
        drib.add(page, 'popular', 'new');
    } else {
        window.localStorage.setItem('current', userName);
        drib.userNav('following');
        drib.add(page, userName, 'new');
    }

    // Set Active Nav Class
    drib.activeNav();

    addshots = setInterval(function () {
        //console.log('adding shots');
        a = $(document).height(),
            b = $(window).height(),
            c = $(window).scrollTop();
        diff = b + c;
        // only load more if there have been loaded some before:

        if (diff >= a - 805 && $('#picsList').height() > 0) {
            from = localStorage.getItem('current');
            what = $("#what").text();
            page++;
            drib.add(page, from);

        }
    }, 1500);

    $('.subInfo').hide();

    // settings button clicked:
    $('.head').on('click', '.settings', function () {
        drib.settings('in');
    });

    // click to close settings menu
    $(window).on('click', '.overlay', function () {
        drib.settings('out');
    });

    $('#picsList').on('click', 'div#fusion_ad', function () {
        var featClickId = $(this).attr('data-clickid'),
            featShotId = $(this).attr('data-shotId');
        _gaq.push(['_trackEvent', 'ad', 'featured clicked', 'fusionClicked']);
        console.log('featured clicked ' + featClickId);
        $.ajax({
            type:'post',
            url:'https://srv.buysellads.com/ads/click/x/' + clickId + '?redirect=no',
            //success:Success,
            //error: Error,
            dataType:'jsonp'
        });
    })
    /* click to close modal window
     $(window).on('click', '.close', function () {
     $(".modalOverlay").delay(250).fadeOut(250);
     $(".modalContainer").addClass('out');
     $('#picsList').removeClass('blur');
     $(".close").fadeOut(250);

     setTimeout(function () {
     $(".modalContainer").fadeOut(250);
     mainViewModel.modal().active(false);
     }, 200);


     });
     $(".close").click(function () {
     $(".overlay").delay(250).fadeOut(250);
     $(".content").removeClass('in').addClass('out').css({
     // "display" : "none"
     });
     });*/
});

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-34206804-3']);
_gaq.push(['_trackPageview']);

(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();

/*(function(){
 var fusion = document.createElement('script');
 fusion.src = 'https://adn.fusionads.net/api/1.0/ad.js?zoneid=238&rand=' + Math.floor(Math.random()*9999999);
 fusion.async = true;
 (document.head || document.getElementsByTagName('head')[0]).appendChild(fusion);
 })();*/