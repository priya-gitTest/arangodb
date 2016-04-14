/*jshint browser: true */
/*jshint unused: false */
/*global Backbone, templateEngine, $, window, arangoHelper, _*/
(function () {
  "use strict";
  window.NavigationView = Backbone.View.extend({
    el: '#navigationBar',
    subEl: '#subNavigationBar',

    events: {
      "change #arangoCollectionSelect": "navigateBySelect",
      "click .tab": "navigateByTab",
      "click li": "switchTab",
      "click .arangodbLogo": "selectMenuItem",
      "mouseenter .dropdown > *": "showDropdown",
      "mouseleave .dropdown": "hideDropdown"
    },

    renderFirst: true,
    activeSubMenu: undefined,

    initialize: function (options) {

      var self = this;

      this.userCollection = options.userCollection;
      this.currentDB = options.currentDB;
      this.dbSelectionView = new window.DBSelectionView({
        collection: options.database,
        current: this.currentDB
      });
      this.userBarView = new window.UserBarView({
        userCollection: this.userCollection
      });
      this.notificationView = new window.NotificationView({
        collection: options.notificationCollection
      });
      this.statisticBarView = new window.StatisticBarView({
          currentDB: this.currentDB
      });

      this.isCluster = options.isCluster;

      this.handleKeyboardHotkeys();

      Backbone.history.on("all", function () {
        self.selectMenuItem();
      });
    },

    handleSelectDatabase: function () {
      this.dbSelectionView.render($("#dbSelect"));
    },

    template: templateEngine.createTemplate("navigationView.ejs"),
    templateSub: templateEngine.createTemplate("subNavigationView.ejs"),

    render: function () {
      var self = this;

      $(this.el).html(this.template.render({
        currentDB: this.currentDB,
        isCluster: this.isCluster
      }));

      $(this.subEl).html(this.templateSub.render({}));
      
      this.dbSelectionView.render($("#dbSelect"));
      this.notificationView.render($("#notificationBar"));

      var callback = function(error) {
        if (!error) {
          this.userBarView.render();
        }
      }.bind(this);

      this.userCollection.whoAmI(callback);
      this.statisticBarView.render($("#statisticBar"));

      if (this.renderFirst) {
        this.renderFirst = false;
          
        this.selectMenuItem();

        $('.arangodbLogo').on('click', function() {
          self.selectMenuItem();
        });
      }

      return this;
    },

    navigateBySelect: function () {
      var navigateTo = $("#arangoCollectionSelect").find("option:selected").val();
      window.App.navigate(navigateTo, {trigger: true});
    },

    handleKeyboardHotkeys: function () {
      arangoHelper.enableKeyboardHotkeys(true);
    },

    navigateByTab: function (e) {
      var tab = e.target || e.srcElement,
      navigateTo = tab.id,
      dropdown = false;

      if (navigateTo === "") {
        navigateTo = $(tab).attr("class");
      }
      
      if (navigateTo === "links") {
        dropdown = true;
        $("#link_dropdown").slideToggle(1);
        e.preventDefault();
      }
      else if (navigateTo === "tools") {
        dropdown = true;
        $("#tools_dropdown").slideToggle(1);
        e.preventDefault();
      }
      else if (navigateTo === "dbselection") {
        dropdown = true;
        $("#dbs_dropdown").slideToggle(1);
        e.preventDefault();
      }

      if (!dropdown) {
        window.App.navigate(navigateTo, {trigger: true});
        e.preventDefault();
      }
    },

    handleSelectNavigation: function () {
      var self = this;
      $("#arangoCollectionSelect").change(function() {
        self.navigateBySelect();
      });
    },

    subViewConfig: {
      documents: 'collections',
      collection: 'collections'
    },

    subMenuConfig: {
      collection: [
        {
          name: 'Settings',
          view: undefined
        },
        {
          name: 'Indices',
          view: undefined
        },
        {
          name: 'Content',
          view: undefined,
          active: true
        }
      ],
      cluster: [
        {
          name: 'Dashboard',
          view: undefined,
          active: true
        },
        {
          name: 'Logs',
          view: undefined,
          disabled: true
        }
      ],
      service: [
        {
          name: 'Info',
          view: undefined,
          active: true
        },
        {
          name: 'API',
          view: undefined,
        },
        {
          name: 'Settings',
          view: undefined,
        }
      ],
      node: [
        {
          name: 'Dashboard',
          view: undefined,
          active: true
        },
        {
          name: 'Logs',
          route: 'nodeLogs',
          params: {
            node: undefined
          }
        }
      ],
      queries: [
        {
          name: 'Editor',
          route: 'query2',
          active: true
        },
        {
          name: 'Running Queries',
          route: 'queryManagement',
          params: {
            active: true
          },
          active: undefined
        },
        {
          name: 'Slow Query History',
          route: 'queryManagement',
          params: {
            active: false
          },
          active: undefined
        }
      ]
    },

    renderSubMenu: function(id) {
      var self = this;

      if (id === undefined) {
        if (window.isCluster) {
          id = 'cluster';
        }
        else {
          id = 'dashboard';
        }
      }

      $(this.subEl + ' .bottom').html('');
      var cssclass = "";

      _.each(this.subMenuConfig[id], function(menu) {
        if (menu.active) {
          cssclass = 'active';
        }
        else {
          cssclass = '';
        }
        if (menu.disabled) {
          cssclass = 'disabled';
        }

        $(self.subEl +  ' .bottom').append(
          '<li class="subMenuEntry ' + cssclass + '"><a>' + menu.name + '</a></li>'
        );
        if (!menu.disabled) {
          $(self.subEl + ' .bottom').children().last().bind('click', function(elem) {
            self.activeSubMenu = menu;
            self.renderSubView(menu, elem);
          });
        }
      });
    },

    renderSubView: function(menu, element) {
      //trigger routers route
      if (window.App[menu.route]) {
        if (window.App[menu.route].resetState) {
          window.App[menu.route].resetState();
        }
        window.App[menu.route]();
      }

      //select active sub view entry
      $(this.subEl + ' .bottom').children().removeClass('active');
      $(element.currentTarget).addClass('active');
    },

    switchTab: function(e) {
      var id = $(e.currentTarget).children().first().attr('id');

      if (id) {
        this.selectMenuItem(id + '-menu');
      }
    },

    /*
    breadcrumb: function (name) {

      if (window.location.hash.split('/')[0] !== '#collection') {
        $('#subNavigationBar .breadcrumb').html(
          '<a class="activeBread" href="#' + name + '">' + name + '</a>'
        );
      }

    },
    */

    selectMenuItem: function (menuItem, noMenuEntry) {

      if (menuItem === undefined) {
        menuItem = window.location.hash.split('/')[0];
        menuItem = menuItem.substr(1, menuItem.length - 1);
      }

      if (menuItem === '') {
        if (window.App.isCluster) {
          menuItem = 'cluster';
        }
        else {
          menuItem = 'dashboard';
        }
      }
      try {
        this.renderSubMenu(menuItem.split('-')[0]);
      }
      catch (e) {
        this.renderSubMenu(menuItem);
      }

      //this.breadcrumb(menuItem.split('-')[0]);

      $('.navlist li').removeClass('active');
      if (typeof menuItem === 'string') {
        if (noMenuEntry) {
          $('.' + this.subViewConfig[menuItem] + '-menu').addClass('active');
        }
        else if (menuItem) {
          $('.' + menuItem).addClass('active');
          $('.' + menuItem + '-menu').addClass('active');
        }
      }
      arangoHelper.hideArangoNotifications();
    },

    showDropdown: function (e) {
      var tab = e.target || e.srcElement;
      var navigateTo = tab.id;
      if (navigateTo === "links" || navigateTo === "link_dropdown" || e.currentTarget.id === 'links') {
        $("#link_dropdown").fadeIn(1);
      }
      else if (navigateTo === "tools" || navigateTo === "tools_dropdown" || e.currentTarget.id === 'tools') {
        $("#tools_dropdown").fadeIn(1);
      }
      else if (navigateTo === "dbselection" || navigateTo === "dbs_dropdown" || e.currentTarget.id === 'dbselection') {
        $("#dbs_dropdown").fadeIn(1);
      }
    },

    hideDropdown: function (e) {
      var tab = e.target || e.srcElement;
      tab = $(tab).parent();
      $("#link_dropdown").fadeOut(1);
      $("#tools_dropdown").fadeOut(1);
      $("#dbs_dropdown").fadeOut(1);
    }

  });
}());
