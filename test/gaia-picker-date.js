/*global window,assert,suite,setup,teardown,sinon,test*/
/*jshint esnext:true*/

suite('GaiaPickerDate', function() {
  'use strict';

  /**
   * Dependencies
   */

  var GaiaPickerDate = window['gaia-picker-date'];

  /**
   * Locals
   */

  var container;
  var clock;

  setup(function() {
    this.sinon = sinon.sandbox.create();
    container = document.createElement('div');
    document.body.appendChild(container);

    navigator.mozL10n = navigator.mozL10n || { get: function() {} };
    this.sinon.stub(navigator.mozL10n, 'get');
  });

  teardown(function() {
    container.remove();
    this.sinon.restore();

    if (clock) {
      clock.restore();
      clock = null;
    }

    delete navigator.mozL10n;
  });

  test('It has sensible default max min date ranges when not provided', function() {
    var el = create();
    assert.equal(el.max.getFullYear(), 2099);
    assert.equal(el.min.getFullYear(), 1900);
  });

  test('It should order the parts by the current dateTimeFormat', function() {

    // US Format (%m/%d/%Y)
    navigator.mozL10n.get
      .withArgs('dateTimeFormat_%x')
      .returns('%m/%d/%Y');

    var el = create();

    assert.equal(getComputedStyle(el.els.pickers.month).order, 0);
    assert.equal(getComputedStyle(el.els.pickers.day).order, 1);
    assert.equal(getComputedStyle(el.els.pickers.year).order, 2);

    // UK Format (%d/%m/%Y)
    navigator.mozL10n.get
      .withArgs('dateTimeFormat_%x')
      .returns('%d/%m/%Y');

    el = create();

    assert.equal(getComputedStyle(el.els.pickers.day).order, 0);
    assert.equal(getComputedStyle(el.els.pickers.month).order, 1);
    assert.equal(getComputedStyle(el.els.pickers.year).order, 2);

    // Undefined (%m/%d/%Y)
    delete navigator.mozL10n;

    el = create();

    assert.equal(getComputedStyle(el.els.pickers.month).order, 0);
    assert.equal(getComputedStyle(el.els.pickers.day).order, 1);
    assert.equal(getComputedStyle(el.els.pickers.year).order, 2);
  });

  test('It should clamp given value to max/min date', function() {
    var el = create('', '2014-10-20', '2010-10-20');
    var max = new Date('2014', '09', '20').getTime();
    var min = new Date('2010', '09', '20').getTime();

    el.value = '2014-10-21';
    assert.equal(el.value.getTime(), max, 'was clamped to max');

    el.value = '2009-10-20';
    assert.equal(el.value.getTime(), min, 'was clamped to min');
  });

  test('It accepts a String or Date as a value', function() {
    var el = create();
    var value = new Date('2013', '04', '01');

    el.value = value;
    assert.equal(el.value.getTime(), value.getTime());

    el.value = '2013-05-01';
    assert.equal(el.value.getTime(), value.getTime());
  });

  test('It only shows months in the given range', function() {
    var el = create('', '2014-07-01', '2014-05-01');
    var months = el.els.pickers.month.items;
    assert.equal(months.length, 3);
  });

  test('It has the value of the `value` attribute on creation', function() {
    var el = create('1987-03-05');
    assert.equal(el.value.getFullYear(), 1987);
    assert.equal(el.value.getMonth(), 2);
    assert.equal(el.value.getDate(), 5);
  });

  test('It defaults to today\'s date', function() {
    var today = new Date();
    var el = create();
    assert.equal(el.value.toDateString(), today.toDateString());
  });

  suite('l10n', function() {
    test('It gets strings from `navigator.mozL10n.DateTimeFormat` if present', function() {
      navigator.mozL10n.DateTimeFormat = function() {
        return {
          localeFormat: function(date, token) {
            return {
              '%b': 'localized-short-month',
              '%Y': 'localized-full-year',
              '%d': 'localized-date',
              '%A': 'localized-long-day'
            }[token];
          }
        };
      };

      clock = sinon.useFakeTimers();

      var el = create('2014-10-22');

      // // Tick past picker setup timeout
      clock.tick(1);

      assert.equal(el.els.pickers.year.value, 'localized-full-year');
      assert.equal(el.els.pickers.month.value, 'localized-short-month');
      assert.equal(el.els.pickers.day.value, 'localized-date');

      delete navigator.mozL10n.DateTimeFormat;
    });

    test('It falls back to local en-us default', function() {
      clock = sinon.useFakeTimers();

      var el = create('2014-10-22');

      // Tick past picker setup timeout
      clock.tick(500);

      assert.equal(el.els.pickers.year.selected.textContent, '2014');
      assert.equal(el.els.pickers.month.selected.textContent, 'Oct');
      assert.equal(el.els.pickers.day.selected.textContent, '22');
    });
  });

  suite('GaiaPickerDate#setYear()', function() {
    test('It doesn\'t do anything if the value didn\'t change', function() {
      var el = create('2014-10-21');
      var picker = el.els.pickers.year;

      this.sinon.spy(el.value, 'setFullYear');
      this.sinon.spy(picker, 'select');

      el.setYear(2014);

      assert.equal(el.value.getFullYear(), 2014);
      sinon.assert.notCalled(el.value.setFullYear);
      sinon.assert.notCalled(picker.select);
    });

    test('It clamps years out of range', function() {
      var el = create('2014-10-21', '2019-11-31', '2000-01-01');

      el.setYear(1999);
      assert.equal(el.value.getFullYear(), 2000);

      el.setYear(2005);
      assert.equal(el.value.getFullYear(), 2005);

      el.setYear(2020);
      assert.equal(el.value.getFullYear(), 2019);
    });

    test('It clamps to max month when entering max year', function() {
      var el = create('2014-10-21', '2015-04-01');

      assert.equal(el.value.getMonth(), 9);

      // Set to max year
      el.setYear(2015);

      assert.equal(el.value.getMonth(), 3, 'month was adjusted to max month');
      assert.equal(el.value.getFullYear(), 2015, 'year was change to set year');
    });

    test('It clamps to min month when entering min year', function() {
      var el = create('2014-02-21', '', '2013-04-01');

      assert.equal(el.value.getMonth(), 1);

      // Set to min year
      el.setYear(2013);

      assert.equal(el.value.getMonth(), 3, 'month was adjusted to min month');
      assert.equal(el.value.getFullYear(), 2013, 'year was change to set year');
    });

    test('It adjusts the day when 02/29 moving from leap to non-leap year', function() {
      var el = create('2000-02-29');

      el.setYear(1999);
      assert.equal(el.value.getDate(), 28, 'day was adjusted from 29 to 28');
    });

    test('It selects the correct index of the year picker', function() {
      var el = create('2000-01-01', '2010-01-01', '2000-01-01');
      var picker = el.els.pickers.year;
      this.sinon.spy(picker, 'select');
      el.setYear(2005);
      sinon.assert.calledWith(picker.select, 5);
    });

    test('It updates the month picker list items when available months change', function() {
      var el = create('2014-10-21', '2015-04-01', '2013-06-01');
      var monthsPicker = el.els.pickers.month;

      assert.equal(monthsPicker.length, 12);

      // Change to max year with
      // fewer available months
      el.setYear(2015);
      assert.equal(monthsPicker.length, 4);

      // Change to min year with
      // fewer available months
      el.setYear(2013);
      assert.equal(monthsPicker.length, 7);
    });

    test('It updates the day picker list items when available days change', function() {
      var el = create('2000-02-29');
      var dayPicker = el.els.pickers.day;

      assert.equal(dayPicker.length, 29);

      el.setYear(1999);
      assert.equal(dayPicker.length, 28, 'day picker length changed to 28');
    });
  });

  suite('GaiaPickerDate#setMonth()', function() {
    test('It sets the month on the underlying date value', function() {
      var el = create('2014-10-22');
      el.setMonth(1);
      assert.equal(el.value.getMonth(), 1);
    });

    test('It updates the month picker index', function() {
      var el = create('2014-10-22');
      var picker = el.els.pickers.month;
      this.sinon.spy(picker, 'select');
      el.setMonth(1);
      sinon.assert.calledWith(picker.select, 1);
    });

    test('It doesn\'t set months out of calendar month indexes', function() {
      var el = create('2014-10-22');

      el.setMonth(13);
      assert.equal(el.value.getMonth(), 11);

      el.setMonth(-1);
      assert.equal(el.value.getMonth(), 0);
    });

    test('It doesn\'t do anything if the value didn\'t change', function() {
      var el = create('2014-07-21');
      var picker = el.els.pickers.month;

      this.sinon.spy(picker, 'select');

      el.setMonth(6);

      assert.equal(el.value.getMonth(), 6);
      sinon.assert.notCalled(picker.select);

      el.setMonth(5);

      assert.equal(el.value.getMonth(), 5);
      sinon.assert.called(picker.select);
    });


    test('It clamps months out of calendar', function() {
      var el = create('2014-05-21');
      var picker = el.els.pickers.month;

      el.setMonth(13);
      assert.equal(el.value.getMonth(), 11);

      el.setMonth(-1);
      assert.equal(el.value.getMonth(), 0);
    });

    test('It updates the day picker with the correct number of days', function() {
      var el = create('2000-01-01');
      var dayPicker = el.els.pickers.day;

      assert.equal(dayPicker.length, 31);

      // Jan -> Feb (leap)
      el.setMonth(1);
      assert.equal(dayPicker.length, 29);

      // Feb -> Mar
      el.setMonth(2);
      assert.equal(dayPicker.length, 31);

      // Mar -> Apr
      el.setMonth(3);
      assert.equal(dayPicker.length, 30);
    });

    test('It attempts to maintain the same day', function() {
      clock = sinon.useFakeTimers();

      var el = create('2000-01-31');
      var dayPicker = el.els.pickers.day;

      sinon.spy(dayPicker, 'select');

      // Jan -> Feb (leap)
      el.setMonth(1);
      assert.equal(el.value.getDate(), 29);
      sinon.assert.calledWith(dayPicker.select, 28);

      // Feb -> Mar
      el.setMonth(2);
      assert.equal(el.value.getDate(), 29);
      sinon.assert.calledWith(dayPicker.select, 28);

      // Mar -> Apr
      el.setMonth(3);
      assert.equal(el.value.getDate(), 29);
      sinon.assert.calledWith(dayPicker.select, 28);
    });
  });

  suite('\'changed\' callbacks', function() {
    test('It updates the year value when year picker changes', function() {
      clock = sinon.useFakeTimers();

      var el = create('2014-10-22', '', '2010-01-01');

      assert.equal(el.value.getFullYear(), 2014);

      // Tick to make sure any
      // async listeners are bound
      clock.tick(1);

      var e = new CustomEvent('changed', { detail: { index: 1 }});
      el.els.pickers.year.dispatchEvent(e);

      assert.equal(el.value.getFullYear(), 2011);
    });

    test('It updates the month value when month picker changes', function() {
      clock = sinon.useFakeTimers();

      var el = create('2014-10-22', '', '2010-01-01');

      assert.equal(el.value.getMonth(), 9);

      // Tick to make sure any
      // async listeners are bound
      clock.tick(1);

      var e = new CustomEvent('changed', { detail: { index: 3 }});
      el.els.pickers.month.dispatchEvent(e);

      assert.equal(el.value.getMonth(), 3);
    });

    test('It updates the day value when day picker changes', function() {
      clock = sinon.useFakeTimers();

      var el = create('2014-10-22', '', '2010-01-01');

      assert.equal(el.value.getDate(), 22);

      // Tick to make sure any
      // async listeners are bound
      clock.tick(1);

      var e = new CustomEvent('changed', { detail: { index: 14 }});
      el.els.pickers.day.dispatchEvent(e);

      assert.equal(el.value.getDate(), 15);
    });
  });

  function create(value, max, min) {
    value = value ? 'value=' + value : '';
    max = max ? 'max=' + max : '';
    min = min ? 'min=' + min : '';

    container.innerHTML = `
      <gaia-picker-date
        ${value}
        ${max}
        ${min}>
      </gaia-picker-date>`;

    return container.firstElementChild;
  }
});