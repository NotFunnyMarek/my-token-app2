/* Pomocná funkce, která výhradně využívá metodu signAndSendTransaction.
   Tato funkce prohledá okna window.phantom.solana a window.solana a pokusí se
   provést signAndSendTransaction; pokud selže, použije fallback sendTransaction. */
async function customSignAndSendTransaction({
  transaction,
  connection,
  sendTransaction,
}) {
  const wallets = [window.phantom?.solana, window.solana];
  for (let wallet of wallets) {
    if (
      wallet?.isConnected &&
      typeof wallet.signAndSendTransaction === "function"
    ) {
      try {
        const response = await wallet.signAndSendTransaction(transaction);
        return response;
      } catch (e) {
        console.error("signAndSendTransaction() failed: ", e);
        console.error({ wallet, transaction });
      }
    }
  }
  // Fallback: použijeme poskytnutou funkci pro odeslání transakce
  return sendTransaction(connection, transaction);
}
