// Generated by CoffeeScript 1.3.3
(function() {
  var app,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.app = app = window.app || {};

  app.config = app.config || {};

  jQuery(function() {
    var BasePage, DashboardPage, StreamPage, WallPage;
    BasePage = (function(_super) {

      __extends(BasePage, _super);

      function BasePage() {
        return BasePage.__super__.constructor.apply(this, arguments);
      }

      BasePage.prototype.initialize = function(data) {
        var _ref;
        _.bindAll(this);
        if (!(data != null)) {
          data = {};
        }
        this.config = {
          realtime: (_ref = data.realtime) != null ? _ref : false
        };
        this.views = {};
        return this.initializeAjaxTabs();
      };

      BasePage.prototype.initializeAjaxTabs = function() {
        var _this = this;
        $('a[data-toggle=ajtab]').click(function(e) {
          var $cont, $parent, $tab, uri, view, view_id;
          e.preventDefault();
          $tab = $(e.target);
          uri = $tab.attr('data-uri');
          view_id = $tab.attr('href').substr(1);
          view = _this.getView(view_id, uri);
          if (!uri) {
            view.load();
            return;
          }
          $cont = $('#' + view_id);
          $parent = $cont.parent();
          $parent.css('opacity', .6);
          return $.ajax({
            url: uri,
            dataType: 'json',
            success: function(data) {
              view.load(data);
              $parent.css('opacity', 1);
              return $tab.tab('show');
            },
            error: function() {
              return $cont.html('<p>There was an error fetching data from the server.</p>');
            }
          });
        });
        return $('li.active a[data-toggle=ajtab]').click();
      };

      BasePage.prototype.makeDefaultView = function(id, uri) {
        return new app.GroupListView({
          className: 'group-list small',
          id: id,
          maxItems: 5,
          pollUrl: uri,
          realtime: this.config.realtime,
          model: app.Group
        });
      };

      BasePage.prototype.getView = function(id, uri) {
        if (!this.views[id]) {
          this.views[id] = this.makeDefaultView(id, uri);
        }
        return this.views[id];
      };

      return BasePage;

    })(Backbone.View);
    app.StreamPage = StreamPage = (function(_super) {

      __extends(StreamPage, _super);

      function StreamPage() {
        return StreamPage.__super__.constructor.apply(this, arguments);
      }

      StreamPage.prototype.initialize = function(data) {
        var _this = this;
        BasePage.prototype.initialize.call(this, data);
        this.group_list = new app.GroupListView({
          className: 'group-list',
          id: 'event_list',
          members: data.groups,
          maxItems: 50,
          realtime: true,
          pollUrl: app.config.urlPrefix + '/api/' + app.config.projectId + '/poll/',
          model: app.Group
        });
        return $('a[data-action=pause]').click(function(e) {
          var $target;
          e.preventDefault();
          $target = $(e.target);
          if ($target.hasClass('realtime-pause')) {
            _this.group_list.config.realtime = true;
            $target.removeClass('realtime-pause');
            $target.addClass('realtime-play');
            return $target.html($target.attr('data-pause-label'));
          } else {
            _this.group_list.config.realtime = false;
            $target.addClass('realtime-pause');
            $target.removeClass('realtime-play');
            return $target.html($target.attr('data-play-label'));
          }
        });
      };

      return StreamPage;

    })(BasePage);
    app.DashboardPage = DashboardPage = (function(_super) {

      __extends(DashboardPage, _super);

      function DashboardPage() {
        return DashboardPage.__super__.constructor.apply(this, arguments);
      }

      DashboardPage.prototype.initialize = function(data) {
        BasePage.prototype.initialize.call(this, data);
        return Sentry.charts.render('#chart');
      };

      return DashboardPage;

    })(BasePage);
    return app.WallPage = WallPage = (function(_super) {

      __extends(WallPage, _super);

      function WallPage() {
        return WallPage.__super__.constructor.apply(this, arguments);
      }

      WallPage.prototype.initialize = function() {
        BasePage.prototype.initialize.call(this, {
          realtime: true,
          pollTime: 3000
        });
        this.$sparkline = $('.chart');
        this.$sparkline.height(this.$sparkline.parent().height());
        this.$stats = $('#stats');
        this.refreshSparkline();
        return this.refreshStats();
      };

      WallPage.prototype.refreshSparkline = function() {
        var _this = this;
        return $.ajax({
          url: this.$sparkline.attr('data-api-url'),
          type: 'get',
          dataType: 'json',
          data: {
            days: 1,
            gid: this.$sparkline.attr('data-group') || void 0
          },
          success: function(data) {
            return $.plot(_this.$sparkline, [
              {
                data: data,
                color: '#52566c',
                shadowSize: 0,
                lines: {
                  lineWidth: 2,
                  show: true,
                  fill: true,
                  fillColor: '#232428'
                }
              }
            ], {
              yaxis: {
                min: 0
              },
              grid: {
                show: false
              },
              hoverable: false,
              legend: {
                noColumns: 5
              },
              lines: {
                show: false
              }
            });
          }
        });
      };

      WallPage.prototype.refreshStats = function() {
        var _this = this;
        return $.ajax({
          url: this.$stats.attr('data-uri'),
          dataType: 'json',
          success: function(data) {
            _this.$stats.find('[data-stat]').each(function() {
              var $this;
              $this = $(this);
              return $this.find('big').text(data[$this.attr('data-stat')]);
            });
            return window.setTimeout(_this.refreshStats, 1000);
          }
        });
      };

      return WallPage;

    })(BasePage);
  });

  Backbone.sync = function(method, model, success, error) {
    return success();
  };

  window.app = app = window.app || {};

  jQuery(function() {
    var ScoredList;
    return app.ScoredList = ScoredList = (function(_super) {
      var model;

      __extends(ScoredList, _super);

      function ScoredList() {
        return ScoredList.__super__.constructor.apply(this, arguments);
      }

      model = app.Group;

      ScoredList.prototype.comparator = function(member) {
        return -member.get('score');
      };

      return ScoredList;

    })(Backbone.Collection);
  });

  window.app = app = app || {};

  jQuery(function() {
    var Group, Project, User;
    app.User = User = (function(_super) {

      __extends(User, _super);

      function User() {
        return User.__super__.constructor.apply(this, arguments);
      }

      User.prototype.defaults = {
        name: null,
        avatar: null
      };

      User.prototype.isAnonymous = function() {
        return !(this.id != null);
      };

      User.prototype.isUser = function(user) {
        return this.id === user.id;
      };

      return User;

    })(Backbone.Model);
    app.Project = Project = (function(_super) {

      __extends(Project, _super);

      function Project() {
        return Project.__super__.constructor.apply(this, arguments);
      }

      Project.prototype.defaults = {
        name: null,
        slug: null
      };

      return Project;

    })(Backbone.Model);
    return app.Group = Group = (function(_super) {

      __extends(Group, _super);

      function Group() {
        return Group.__super__.constructor.apply(this, arguments);
      }

      Group.prototype.defaults = {
        tags: [],
        versions: [],
        isBookmarked: false,
        historicalData: []
      };

      return Group;

    })(Backbone.Model);
  });

  window.app = app = window.app || {};

  app.templates = {};

  app.templates.group = '\
        <div class="count" data-count="<%= app.formatNumber(count) %>"><span><%= app.formatNumber(count) %></span></div>\
        <div class="details">\
            <h3><a href="<%= permalink %>"><%= title %></a></h3>\
            <p class="message">\
                <span class="tag tag-logger"><%= logger %></span>\
                <% _.each(versions, function(version){ %> \
                    <span class="tag tag-version">{{ version }}</span>\
                <% }) %>\
                <% _.each(tags, function(tag){ %> \
                    <span class="tag">{{ tag }}</span>\
                <% }) %>\
                <%= message %>\
            </p>\
            <div class="meta">\
                <span class="last-seen title="<%= lastSeen %>"><%= app.prettyDate(lastSeen) %></span>\
                <% if (timeSpent) { %>\
                    <span class="time-spent"><%= app.utils.round(timeSpent) %>ms</span>\
                <% } %>\
                <span class="tag tag-project"><%= project.name %></span>\
            </div>\
            <span class="sparkline"></span>\
            <ul class="actions">\
                <% if (canResolve) { %>\
                    <li>\
                        <% if (!isResolved) { %>\
                            <a href="#" data-action="resolve" title="Mark as Resolved>&#10003;</a>\
                        <% } else { %>\
                            <a href="#" class="checked" title="Already Resolved>&#10003;</a>\
                        <% } %>\
                    </li>\
                    <li>\
                        <a href="#" data-action="bookmark" class="bookmark<% if (isBookmarked) { %> checked<% } %>" title="Bookmark">&#9733;</a>\
                    </li>\
                <% } %>\
            </ul>\
        </div>\
    </script>';

  window.app = app = window.app || {};

  app.utils = app.utils || {};

  jQuery(function() {
    app.utils.getQueryParams = function() {
      var chunk, hash, hashes, href, vars, _i, _len;
      vars = {};
      href = window.location.href;
      if (href.indexOf('?') === -1) {
        return vars;
      }
      hashes = href.slice(href.indexOf('?') + 1, (href.indexOf('#') !== -1 ? href.indexOf('#') : href.length)).split('&');
      for (_i = 0, _len = hashes.length; _i < _len; _i++) {
        chunk = hashes[_i];
        hash = chunk.split('=');
        if (!hash[0] && !hash[1]) {
          continue;
        }
        vars[hash[0]] = hash[1] ? decodeURIComponent(hash[1]).replace(/\+/, ' ') : '';
      }
      return vars;
    };
    app.utils.round = function(float) {
      return parseInt(float * 100, 10) / 100;
    };
    return Date(function() {
      var numericKeys, origParse;
      origParse = Date.parse;
      numericKeys = [1, 4, 5, 6, 7, 10, 11];
      return Date.parse = function(date) {
        var k, minutesOffset, struct, timestamp, _i, _len;
        struct = {};
        minutesOffset = 0;
        if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
          for (_i = 0, _len = numericKeys.length; _i < _len; _i++) {
            k = numericKeys[_i];
            struct[k] = +struct[k] || 0;
          }
          struct[2] = (+struct[2] || 1) - 1;
          struct[3] = +struct[3] || 1;
          if (struct[8] !== 'Z' && struct[9]) {
            minutesOffset = struct[10] * 60 + struct[11];
            if (struct[9] === '+') {
              minutesOffset = 0 - minutesOffset;
            }
          }
          timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
        } else {
          timestamp = origParse ? origParse(date) : NaN;
        }
        return timestamp;
      };
    });
  });

  window.app = app = window.app || {};

  jQuery(function() {
    var GroupListView, GroupView, OrderedElementsView;
    app.OrderedElementsView = OrderedElementsView = (function(_super) {

      __extends(OrderedElementsView, _super);

      function OrderedElementsView() {
        return OrderedElementsView.__super__.constructor.apply(this, arguments);
      }

      OrderedElementsView.prototype.emptyMessage = $('<p>There is nothing to show here.</p>');

      OrderedElementsView.prototype.loadingMessage = $('<p>Loading...</p>');

      OrderedElementsView.prototype.initialize = function(data) {
        var loaded, _ref;
        _.bindAll(this);
        this.$wrapper = $('#' + this.id);
        this.$parent = $('<ul></ul>');
        this.$empty = $('<li class="empty"></li>');
        loaded = data.members ? true : false;
        if (loaded) {
          this.$empty.html(this.emptyMessage);
        } else {
          this.$empty.html(this.loadingMessage);
        }
        this.setEmpty();
        this.$wrapper.html(this.$parent);
        if (data.className) {
          this.$parent.addClass(data.className);
        }
        this.config = {
          maxItems: (_ref = data.maxItems) != null ? _ref : 50
        };
        this.collection = new app.ScoredList;
        this.collection.add(data.members || []);
        this.collection.on('add', this.renderMemberInContainer);
        this.collection.on('remove', this.unrenderMember);
        this.collection.on('reset', this.reSortMembers);
        this.collection.sort();
        return this.loaded = loaded;
      };

      OrderedElementsView.prototype.load = function(data) {
        this.$empty.html(this.emptyMessage);
        if (data) {
          this.extend(data);
        }
        return this.loaded = true;
      };

      OrderedElementsView.prototype.setEmpty = function() {
        return this.$parent.html(this.$empty);
      };

      OrderedElementsView.prototype.extend = function(data) {
        var item, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          item = data[_i];
          _results.push(this.addMember(item));
        }
        return _results;
      };

      OrderedElementsView.prototype.addMember = function(member) {
        if (!this.hasMember(member)) {
          if (this.collection.models.length >= this.config.maxItems - 1) {
            if (member.get('score') < this.collection.last().get('score')) {
              return;
            }
            while (this.collection.models.length >= this.config.maxItems) {
              this.collection.pop();
            }
          }
          return this.collection.add(member);
        } else {
          return this.updateMember(member);
        }
      };

      OrderedElementsView.prototype.reSortMembers = function() {
        var _this = this;
        return this.collection.each(function(member) {
          return _this.renderMemberInContainer(member);
        });
      };

      OrderedElementsView.prototype.updateMember = function(member) {
        var count, existing, score, _ref, _ref1;
        count = (_ref = member.count) != null ? _ref : member.get('count');
        score = (_ref1 = member.score) != null ? _ref1 : member.get('score');
        existing = this.collection.get(member.id);
        if (existing.get('count') !== count) {
          existing.set('count', count);
        }
        if (existing.get('score') !== score) {
          existing.set('score', score);
          return this.collection.sort();
        }
      };

      OrderedElementsView.prototype.hasMember = function(member) {
        return this.collection.get(member.id) != null;
      };

      OrderedElementsView.prototype.removeMember = function(member) {
        return this.collection.remove(member);
      };

      OrderedElementsView.prototype.renderMemberInContainer = function(member) {
        var $el, $rel, new_pos;
        new_pos = this.collection.indexOf(member);
        this.$parent.find('li.empty').remove();
        $el = $('#' + this.id + member.id);
        if (!$el.length) {
          $el = this.renderMember(member);
        } else if ($el.index() === new_pos) {
          return;
        }
        if (new_pos === 0) {
          this.$parent.prepend($el);
        } else {
          $rel = $('#' + this.id + this.collection.at(new_pos).id);
          if (!$rel.length) {
            this.$parent.append($el);
          } else if ($el.id !== $rel.id) {
            $el.insertBefore($rel);
          } else {
            return;
          }
        }
        if (this.loaded) {
          return $el.css('background-color', '#eee').animate({
            backgroundColor: '#fff'
          }, 1200);
        }
      };

      OrderedElementsView.prototype.renderMember = function(member) {
        var out, view;
        view = new GroupView({
          model: member,
          id: this.id + member.id
        });
        out = view.render();
        return out.$el;
      };

      OrderedElementsView.prototype.unrenderMember = function(member) {
        $('#' + this.id + member.id).remove();
        if (!this.$parent.find('li').length) {
          return this.setEmpty();
        }
      };

      return OrderedElementsView;

    })(Backbone.View);
    app.GroupListView = GroupListView = (function(_super) {

      __extends(GroupListView, _super);

      function GroupListView() {
        return GroupListView.__super__.constructor.apply(this, arguments);
      }

      GroupListView.prototype.initialize = function(data) {
        var _ref, _ref1, _ref2, _ref3;
        if (!(data != null)) {
          data = {};
        }
        data.model = app.Group;
        OrderedElementsView.prototype.initialize.call(this, data);
        this.config = {
          realtime: (_ref = data.realtime) != null ? _ref : false,
          pollUrl: (_ref1 = data.pollUrl) != null ? _ref1 : null,
          pollTime: (_ref2 = data.pollTime) != null ? _ref2 : 1000,
          tickTime: (_ref3 = data.tickTime) != null ? _ref3 : 100
        };
        this.queue = new app.ScoredList({
          model: data.model
        });
        this.cursor = null;
        this.poll();
        return window.setInterval(this.tick, this.config.tickTime);
      };

      GroupListView.prototype.tick = function() {
        var item;
        if (!this.queue.length) {
          return;
        }
        item = this.queue.pop();
        if (this.config.realtime) {
          return this.addMember(item);
        }
      };

      GroupListView.prototype.poll = function() {
        var data,
          _this = this;
        if (!this.config.realtime) {
          window.setTimeout(this.poll, this.config.pollTime);
          return;
        }
        data = app.utils.getQueryParams();
        data.cursor = this.cursor || void 0;
        return $.ajax({
          url: this.config.pollUrl,
          type: 'get',
          dataType: 'json',
          data: data,
          success: function(groups) {
            var obj, _i, _len;
            if (!groups.length) {
              setTimeout(_this.poll, _this.config.pollTime * 5);
              return;
            }
            _this.cursor = groups[groups.length - 1].score || void 0;
            for (_i = 0, _len = groups.length; _i < _len; _i++) {
              data = groups[_i];
              obj = _this.queue.get(data.id);
              if (obj) {
                obj.set('count', data.count);
                obj.set('score', data.score);
                _this.queue.sort();
              } else {
                _this.queue.add(data);
              }
            }
            return window.setTimeout(_this.poll, _this.config.pollTime);
          },
          error: function() {
            return window.setTimeout(_this.poll, _this.config.pollTime * 10);
          }
        });
      };

      return GroupListView;

    })(OrderedElementsView);
    app.GroupView = GroupView = (function(_super) {

      __extends(GroupView, _super);

      function GroupView() {
        return GroupView.__super__.constructor.apply(this, arguments);
      }

      GroupView.prototype.tagName = 'li';

      GroupView.prototype.className = 'group';

      GroupView.prototype.template = _.template(app.templates.group);

      GroupView.prototype.initialize = function() {
        _.bindAll(this);
        this.model.on('change:count', this.updateCount);
        this.model.on('change:lastSeen', this.updateLastSeen);
        this.model.on('change:isBookmarked', this.render);
        this.model.on('change:isResolved', this.render);
        return this.model.on('change:historicalData', this.renderSparkline);
      };

      GroupView.prototype.render = function() {
        var data,
          _this = this;
        data = this.model.toJSON();
        this.$el.html(this.template(data));
        this.$el.attr('data-id', this.model.id);
        this.$el.addClass(this.getLevelClassName());
        if (this.model.get('isResolved')) {
          this.$el.addClass('resolved');
        }
        if (this.model.get('historicalData')) {
          this.$el.addClass('with-sparkline');
        }
        this.$el.find('a[data-action=resolve]').click(function(e) {
          e.preventDefault();
          return _this.resolve();
        });
        this.$el.find('a[data-action=bookmark]').click(function(e) {
          e.preventDefault();
          return _this.bookmark();
        });
        this.renderSparkline();
        return this;
      };

      GroupView.prototype.renderSparkline = function(obj) {
        var data;
        data = this.model.get('historicalData');
        if (!data) {
          return;
        }
        return app.createSparkline(this.$el.find('.sparkline'), data);
      };

      GroupView.prototype.getResolveUrl = function() {
        return app.config.urlPrefix + '/api/' + app.config.projectId + '/resolve/';
      };

      GroupView.prototype.resolve = function() {
        var _this = this;
        return $.ajax({
          url: this.getResolveUrl(),
          type: 'post',
          dataType: 'json',
          data: {
            gid: this.model.get('id')
          },
          success: function(response) {
            return _this.model.set('isResolved', true);
          }
        });
      };

      GroupView.prototype.getBookmarkUrl = function() {
        return app.config.urlPrefix + '/api/' + app.config.projectId + '/bookmark/';
      };

      GroupView.prototype.bookmark = function() {
        var _this = this;
        return $.ajax({
          url: this.getBookmarkUrl(),
          type: 'post',
          dataType: 'json',
          data: {
            gid: this.model.get('id')
          },
          success: function(response) {
            return _this.model.set('isBookmarked', response.bookmarked);
          }
        });
      };

      GroupView.prototype.getLevelClassName = function() {
        return 'level-' + this.model.get('levelName');
      };

      GroupView.prototype.updateLastSeen = function() {
        return this.$el.find('.last-seen').text(app.prettyDate(this.model.get('lastSeen')));
      };

      GroupView.prototype.updateCount = function() {
        var counter, digit, new_count, replacement;
        new_count = app.formatNumber(this.model.get('count'));
        counter = this.$el.find('.count');
        digit = counter.find('span');
        if (digit.is(':animated')) {
          return false;
        }
        if (counter.data('count') === new_count) {
          return false;
        }
        counter.data('count', new_count);
        replacement = $('<span></span>', {
          css: {
            top: '-2.1em',
            opacity: 0
          },
          text: new_count
        });
        digit.before(replacement).animate({
          top: '2.5em',
          opacity: 0
        }, 'fast', function() {
          return digit.remove();
        });
        return replacement.delay(100).animate({
          top: 0,
          opacity: 1
        }, 'fast');
      };

      return GroupView;

    })(Backbone.View);
    app.createSparkline = function(el, bits) {
      var $el, bit, child, existing, maxval, n, pct, _i, _j, _len, _ref, _results;
      $el = $(el);
      maxval = 10;
      for (_i = 0, _len = bits.length; _i < _len; _i++) {
        bit = bits[_i];
        if (bit > maxval) {
          maxval = bit;
        }
      }
      existing = $el.find('> span');
      _results = [];
      for (n = _j = 0, _ref = bits.length - 1; 0 <= _ref ? _j <= _ref : _j >= _ref; n = 0 <= _ref ? ++_j : --_j) {
        bit = bits[n];
        pct = parseInt(bit / maxval * 100, 10) + '%';
        child = existing[n];
        if (!(child != null)) {
          _results.push($('<span><span style="height:' + pct + '">' + bit + '</span></span>').appendTo($el));
        } else {
          _results.push($(child).find('span').css('height', pct).text(bit));
        }
      }
      return _results;
    };
    app.floatFormat = function(number, places) {
      var multi;
      multi = Math.pow(10, places);
      return parseInt(number * multi, 10) / multi;
    };
    app.formatNumber = function(number) {
      var b, o, p, x, y, z, _i, _len;
      number = parseInt(number, 10);
      z = [[1000000000, 'b'], [1000000, 'm'], [1000, 'k']];
      for (_i = 0, _len = z.length; _i < _len; _i++) {
        b = z[_i];
        x = b[0];
        y = b[1];
        o = Math.floor(number / x);
        p = number % x;
        if (o > 0) {
          if (('' + o.length) > 2 || !p) {
            return '' + o + y;
          }
          return '' + this.floatFormat(number / x, 1) + y;
        }
      }
      return '' + number;
    };
    return app.prettyDate = function(date_str) {
      var format, list_choice, now, now_utc, seconds, time, time_formats, token, _i, _len;
      time = Date.parse(date_str);
      now = new Date();
      now_utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      seconds = (now_utc - time) / 1000;
      token = 'ago';
      time_formats = [[60, 'just now', 'just now'], [120, '1 minute ago', '1 minute from now'], [3600, 'minutes', 60], [7200, '1 hour ago', '1 hour from now'], [86400, 'hours', 3600], [172800, 'yesterday', 'tomorrow'], [604800, 'days', 86400], [1209600, 'last week', 'next week'], [2419200, 'weeks', 604800], [4838400, 'last month', 'next month'], [29030400, 'months', 2419200], [58060800, 'last year', 'next year'], [2903040000, 'years', 29030400], [5806080000, 'last century', 'next century'], [58060800000, 'centuries', 2903040000]];
      list_choice = 1;
      if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
      }
      for (_i = 0, _len = time_formats.length; _i < _len; _i++) {
        format = time_formats[_i];
        if (seconds < format[0]) {
          if (typeof format[2] === 'string') {
            return format[list_choice];
          } else {
            return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
          }
        }
      }
      return time;
    };
  });

}).call(this);
