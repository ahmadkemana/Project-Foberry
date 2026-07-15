/**
 * Client-side equivalent of Liquid's `money` / `money_with_currency` filters.
 *
 * Call sites pass the format string from Liquid (`shop.money_format` or
 * `shop.money_with_currency_format`) so JS-rendered prices match the ones the
 * server rendered, in whatever currency the store is currently selling in.
 *
 * @param {number|string} cents - Price in cents.
 * @param {string} format - A Shopify money format string, e.g. "${{amount}}".
 * @returns {string} The formatted price.
 */
window.formatThemeMoney =
  window.formatThemeMoney ||
  function formatThemeMoney(cents, format) {
    var value = typeof cents === 'string' ? cents.replace('.', '') : cents;
    var placeholder = /\{\{\s*(\w+)\s*\}\}/;

    function group(number, precision, thousands, decimal) {
      if (number == null || isNaN(number)) return '0';

      var parts = (number / 100.0).toFixed(precision).split('.');
      var whole = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);

      return whole + (parts[1] ? decimal + parts[1] : '');
    }

    var match = String(format || '').match(placeholder);
    if (!match) return String(value);

    var formatted;
    switch (match[1]) {
      case 'amount_no_decimals':
        formatted = group(value, 0, ',', '.');
        break;
      case 'amount_with_comma_separator':
        formatted = group(value, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        formatted = group(value, 0, '.', ',');
        break;
      case 'amount_with_apostrophe_separator':
        formatted = group(value, 2, "'", '.');
        break;
      case 'amount_with_space_separator':
        formatted = group(value, 2, ' ', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        formatted = group(value, 0, ' ', ',');
        break;
      case 'amount_with_period_and_space_separator':
        formatted = group(value, 2, ' ', '.');
        break;
      case 'amount':
      default:
        formatted = group(value, 2, ',', '.');
    }

    return format.replace(placeholder, formatted);
  };

/**
 * Total of the `additional_price` line-item property (customizer surcharge),
 * in cents, across a quantity. The property is stored in major units.
 *
 * @param {{properties?: Record<string, string>, quantity: number}} item - A cart line item from the Cart AJAX API.
 * @returns {number} The surcharge total in cents.
 */
window.themeAdditionalPriceCents =
  window.themeAdditionalPriceCents ||
  function themeAdditionalPriceCents(item) {
    var raw = parseFloat((item.properties || {}).additional_price);
    if (!raw || isNaN(raw)) return 0;
    return Math.round(raw * 100) * item.quantity;
  };

/**
 * The cart total including every line's `additional_price` surcharge — mirrors
 * the Liquid in cart-summary.liquid so JS and server-rendered totals agree.
 *
 * @param {{items: Array<Object>, total_price: number}} cart - A cart from the Cart AJAX API.
 * @returns {number} The cart total in cents.
 */
window.themeCartTotalCents =
  window.themeCartTotalCents ||
  function themeCartTotalCents(cart) {
    return cart.items.reduce(function (sum, item) {
      return sum + window.themeAdditionalPriceCents(item);
    }, cart.total_price);
  };
