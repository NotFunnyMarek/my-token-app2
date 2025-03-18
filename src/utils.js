/* Pomocná funkce, která výhradně využívá metodu signAndSendTransaction.
   Tato funkce prohledá okna window.phantom.solana a window.solana a pokusí se
   provést signAndSendTransaction; pokud selže, použije fallback sendTransaction. */
export async function customSignAndSendTransaction({
  transaction,
  connection,
  sendTransaction,
  signAndSendTransaction,
}) {
  // use provided signAndSendTransaction() if it's a function
  if (typeof signAndSendTransaction === "function") {
    try {
      const response = await signAndSendTransaction(transaction);
      console.debug(
        "transaction sent with provided signAndSendTransaction() successfully",
        response,
      );
      return response;
    } catch (e) {
      console.error("provided signAndSendTransaction() failed: ", e);
      console.error({ signAndSendTransaction, transaction });
    }
  }

  const wallets = [window.phantom?.solana, window.solana];
  for (let wallet of wallets) {
    if (
      wallet?.isConnected &&
      typeof wallet.signAndSendTransaction === "function"
    ) {
      try {
        const response = await wallet.signAndSendTransaction(transaction);
        console.debug(
          "transaction sent with signAndSendTransaction() successfully",
          response,
        );
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
