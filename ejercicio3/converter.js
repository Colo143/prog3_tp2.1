class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {

        this.apiUrl = apiUrl;
        this.currencies = [];

    }

    async getCurrencies() {

        const response = await fetch(`${this.apiUrl}/currencies`);
        const data = await response.json();
        this.currencies = Object.entries(data).map(
            ([code, name]) => new Currency(code, name)
        );

    }

    async convertCurrency(amount, fromCurrency, toCurrency) {

        if (fromCurrency.code === toCurrency.code) {
            return amount;
        }
        try {
            const response = await fetch(
                `${this.apiUrl}/latest?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`
            );
            const data = await response.json();
            return data.rates[toCurrency.code] * amount;
        } catch (error) {
            console.error('Error during conversion:', error);
            return null;
        }

    }

    async getRateDifference(fromCurrency, toCurrency, previousDate) {

        try {
            const today = this.formatDate(new Date());
            const responseToday = await fetch(
                `${this.apiUrl}/${today}?from=${fromCurrency.code}&to=${toCurrency.code}`
            );
            const responsePrevious = await fetch(
                `${this.apiUrl}/${previousDate}?from=${fromCurrency.code}&to=${toCurrency.code}`
            );

            const dataToday = await responseToday.json();
            const dataPrevious = await responsePrevious.json();

            const rateToday = dataToday.rates[toCurrency.code];
            const ratePrevious = dataPrevious.rates[toCurrency.code];

            return rateToday - ratePrevious;
        } catch (error) {
            console.error('Error fetching rate difference:', error);
            return null;
        }

    }

    formatDate(date) {

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
        
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    await converter.getCurrencies();
    populateCurrencies(fromCurrencySelect, converter.currencies);
    populateCurrencies(toCurrencySelect, converter.currencies);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrency = converter.currencies.find(
            (currency) => currency.code === fromCurrencySelect.value
        );
        const toCurrency = converter.currencies.find(
            (currency) => currency.code === toCurrencySelect.value
        );

        const convertedAmount = await converter.convertCurrency(
            amount,
            fromCurrency,
            toCurrency
        );

        if (convertedAmount !== null && !isNaN(convertedAmount)) {
            resultDiv.textContent = `${amount} ${
                fromCurrency.code
            } son ${convertedAmount.toFixed(2)} ${toCurrency.code}`;
        } else {
            resultDiv.textContent = "Error al realizar la conversión.";
        }
    });

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach((currency) => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});
