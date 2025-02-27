# Telegram Bot for P2P Submarine Swaps Between Lightning Network and TON

**Telegram bot** designed to facilitate **peer-to-peer (P2P) submarine swaps** between the **Bitcoin Lightning Network** and **TON blockchain**. The bot allows users to securely exchange Bitcoin (via Lightning) and tgBTC (on TON) in a trustless, decentralized manner. It simplifies the process of creating, selecting, and completing swaps using a MiniApp, while ensuring that users only lock their funds (tgBTC) after an initial agreement is reached.

---

## **How It Works**

### **1. Swap Creation**
- A user can **create a swap** by specifying the **amount** and **destination** (Lightning or TON) using the `/create` command or by using the **MiniApp** available with command `/start`.
- The bot stores the swap details (e.g., amount, destination, and user's chat ID) and marks it as **pending**.
- The user is notified when another user selects their swap.

### **2. Swap Selection**
- Users can **list available swaps** using the `/list` command or view them in the **MiniApp**.
- To participate in a swap, a user selects a pending swap using the `/select` command or the MiniApp.
- Once a swap is selected, the bot notifies the swap creator and marks the swap as **selected**.

### **3. Swap Execution**

Once a swap is selected, the following steps ensure a secure and trustless exchange:

1. **Locking tgBTC**:
   - The user with tgBTC (on TON) is prompted to **lock their funds** in the TON smart contract via the **MiniApp**.
   - The MiniApp requires the user to provide a **Lightning invoice** with the **exact amount** specified in the swap (stored as "pending").
   - The MiniApp decodes the invoice to:
     - Verify that the **amount matches** the swap amount.
     - Extract the **hashlock** (derived from the invoice's payment hash).
     - Set the **timelock** to either the invoice's expiration time or the expiration time plus a buffer (e.g., 1 hour) to ensure sufficient time for the swap to complete.

2. **Paying the Invoice**:
   - The user paying with Bitcoin (via Lightning) receives the invoice through the MiniApp.
   - They pay the invoice, which reveals the **preimage** (secret code) upon successful payment.

3. **Claiming tgBTC**:
   - Once the invoice is paid, the preimage is used to unlock the tgBTC locked in the TON smart contract.
   - The counterparty (the user who paid the invoice) can claim the tgBTC by providing the preimage.

4. **Refund Mechanism**:
   - If the swap is not completed before the **timelock** expires, the user who locked tgBTC can refund their funds.
   - The timelock ensures that funds are not locked indefinitely, providing a safety net for both parties.

This process ensures that:
- The **amount** in the invoice matches the swap amount, preventing discrepancies.
- The **hashlock** and **timelock** are securely derived from the invoice, ensuring atomicity and fairness.
- Funds are only locked after an initial agreement, reducing the risk of funds being locked without a counterparty.
### **4. Refund Mechanism**
- If the swap is not completed before the **timelock** expires, the tgBTC can be refunded to the original owner.
- The timelock is designed to match or exceed the expiration time of the Lightning invoice, ensuring fairness.

---

## **Key Features of the Bot**

### **1. Commands**
- `/start`: Opens the MiniApp to get started creating or selecting a swap.
- `/create [destination] [amount]`: Creates a new swap (e.g., `/create Lightning 10`).
- `/list`: Lists all available swaps.
- `/mypending`: Lists swaps created by the user.
- `/myselected`: Lists swaps selected by the user.
- `/select [swapId]`: Selects a specific swap to participate in.
- `/finish [swapId]`: Completes a selected swap.
- `/help`: Displays all available commands.

### **2. MiniApp Integration**
- The **MiniApp** provides a user-friendly interface for:
  - Creating, listing, and selecting swaps.
  - Interacting with the TON blockchain to lock tgBTC and set hashlocks and timelocks from the Lightning Network invoice created.
  - Managing Lightning Network payments (generating and paying invoices).

### **3. Trustless and Secure**
- Users only lock their funds (tgBTC) after an initial agreement is reached, reducing the risk of funds being locked without a counterparty.
- The TON smart contract ensures atomicity, meaning the swap either completes successfully or allows refunds.

---

## **Workflow Example**

1. **Alice (Swap Creator)**:
   - **Creates a Swap**:
     - Alice creates a swap to exchange **10 satoshis of tgBTC** for **10 satoshis of Bitcoin** using the `/create Lightning 10` command in the bot or directly through the **MiniApp** by using the command `/start`.
     - The bot stores the swap details (e.g., amount, destination, and Alice's chat ID) and marks it as **pending**.
   - **Waits for Selection**:
     - Alice waits for another user to select her swap.

2. **Bob (Swap Selector)**:
   - **Lists Available Swaps**:
     - Bob uses the `/list` command in the bot or the **MiniApp** to view all available swaps.
   - **Selects a Swap**:
     - Bob selects Alice’s swap using the `/select [swapId]` command in the bot or by clicking on the swap in the **MiniApp**.
   - **Notification**:
     - The bot notifies Alice that her swap has been selected.

3. **Alice (Locking Funds)**:
   - **Locks tgBTC**:
     - Alice uses the **MiniApp** to lock her **10 satoshis of tgBTC** in the TON smart contract.
     - She provides:
       - A **hashlock** (derived from the Lightning invoice she created).
       - A **timelock** (set to the invoice's expiration time or expiration time plus a buffer, e.g., 1 hour).

4. **Bob (Paying Invoice)**:
   - **Receives Invoice**:
     - Bob receives the Lightning invoice from Alice via the **MiniApp**.
   - **Pays Invoice**:
     - Bob pays the invoice, which reveals the **preimage** upon successful payment.

5. **Swap Completion**:
   - **Claiming tgBTC**:
     - Once the invoice is paid, Bob uses the preimage to claim the **10 satoshis of tgBTC** locked in the TON smart contract.
   - **Refund Mechanism**:
     - If the swap isn’t completed before the **timelock** expires, Alice can refund her **10 satoshis of tgBTC**.

---

### **Key Notes**:
- **All Actions in Bot or MiniApp**:
  - Users can perform **swap creation**, **listing**, and **selection** either through **bot commands** (e.g., `/create`, `/list`, `/select`) or via the **MiniApp** for a more visual and interactive experience.
- **MiniApp for Advanced Actions**:
  - The **MiniApp** is required for:
    - Locking tgBTC in the TON smart contract (providing hashlock and timelock).
    - Generating and paying Lightning invoices.
    - Claiming tgBTC using the preimage.

---

## **Why Use This Bot?**
- **Trustless**: No need for intermediaries; swaps are executed securely using cryptographic protocols.
- **User-Friendly**: The bot and MiniApp make it easy to manage swaps, even for non-technical users.
- **Cross-Chain**: Enables seamless exchanges between Bitcoin (Lightning) and TON (tgBTC).
- **Decentralized**: Built on blockchain technology, ensuring transparency and security.

---

## Getting started

Create a `.env` file with following content: 

```
BOT_TOKEN=BOT_TOKEN_CREATED_WITH_BOT_FATHER
MINIAPP_URL=URL_OF_THE_MINIAPP
```

Install packages with ```npm install``` and then run ```index.js``` with ```node index.js```

---

## **License**
This project is licensed under the [MIT License](LICENSE).
