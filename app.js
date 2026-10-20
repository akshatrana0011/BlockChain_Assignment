/* CampusFix frontend — ethers.js v6 */
const CONTRACT_ADDRESS = "0x2c20e95d3cf715e1dbbb48112168ad083fa458cc9";
const ABI = [
  "function owner() view returns (address)",
  "function requestCount() view returns (uint256)",
  "function createRequest(string title, string description) returns (uint256)",
  "function getRequest(uint256 id) view returns (tuple(uint256 id,address requester,string title,string description,uint8 status,uint256 createdAt,uint256 updatedAt))",
  "function getRequests(uint256 offset,uint256 limit) view returns (tuple(uint256 id,address requester,string title,string description,uint8 status,uint256 createdAt,uint256 updatedAt)[])",
  "function updateStatus(uint256 id,uint8 newStatus)",
  "event RequestCreated(uint256 indexed id,address indexed requester,string title,uint256 createdAt)",
  "event StatusChanged(uint256 indexed id,uint8 oldStatus,uint8 newStatus,address indexed updatedBy,uint256 updatedAt)"
];
const STATUS = ["Open", "In Progress", "Resolved"];
let provider, signer, contract, activeAccount = "", ownerAccount = "";
let requests = [];
const $ = (id) => document.getElementById(id);
const shortAddress = (address) => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "No account";
const formatDate = (seconds) => new Date(Number(seconds) * 1000).toLocaleString();
const safeText = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
function message(text, kind = "success") {
  const el = $("formMessage"); el.textContent = text; el.className = `message show ${kind}`;
}
function toast(text) {
  const el = $("toast"); el.textContent = text; el.classList.add("show");
  window.setTimeout(() => el.classList.remove("show"), 3200);
}
function setBusy(button, busy, label) {
  button.disabled = busy;
  if (busy) { button.dataset.originalText = button.textContent; button.textContent = label; }
  else if (button.dataset.originalText) { button.textContent = button.dataset.originalText; delete button.dataset.originalText; }
}
function statusName(status) { return STATUS[Number(status)] || "Unknown"; }
async function connectWallet() {
  if (!window.ethereum) {
    message("MetaMask was not detected. Open this site in a browser with the MetaMask extension enabled, then reload.", "error");
    return;
  }
  if (!window.ethers) {
    message("The ethers.js library did not load. Check your internet connection, then hard-refresh this page.", "error");
    return;
  }
  const button = $("connectButton");
  setBusy(button, true, "Connecting…");
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    activeAccount = await signer.getAddress();

    // Reflect the wallet connection immediately, even if contract configuration is wrong.
    button.textContent = shortAddress(activeAccount);
    button.classList.add("connected");
    $("accountLabel").textContent = shortAddress(activeAccount);

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    $("networkLabel").textContent = `Wallet connected · chain ${chainId}`;

    if (!ethers.isAddress(CONTRACT_ADDRESS)) {
      contract = null;
      $("networkLabel").textContent = "Wallet connected · contract address invalid";
      message("MetaMask connected, but the CampusFix contract address in app.js is invalid.", "error");
      return;
    }
    if (chainId !== 11155111) {
      contract = null;
      $("networkLabel").textContent = `Wrong network · chain ${chainId}`;
      message("MetaMask connected. Switch MetaMask to Sepolia Test Network to use CampusFix.", "error");
      return;
    }

    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      contract = null;
      $("networkLabel").textContent = "Wallet connected · contract not found on Sepolia";
      message("MetaMask is connected to Sepolia, but no contract code exists at the configured address on this network. In Remix, deploy CampusFix using Injected Provider - MetaMask with Sepolia selected, then update CONTRACT_ADDRESS in app.js.", "error");
      $("requestCountLabel").textContent = "CampusFix contract not found on Sepolia";
      return;
    }

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    ownerAccount = await contract.owner();
    $("networkLabel").textContent = "Connected · Sepolia";
    await loadRequests();
    toast("Wallet connected successfully");
  } catch (error) {
    const detail = error?.shortMessage || error?.reason || error?.message || "Could not connect wallet.";
    message(detail, "error");
    if (activeAccount) {
      $("networkLabel").textContent = "Wallet connected · contract connection failed";
    }
  } finally {
    setBusy(button, false);
    if (activeAccount) button.textContent = shortAddress(activeAccount);
  }
}
async function loadRequests() {
  if (!contract) { $("requestCountLabel").textContent = "Connect wallet and configure the contract"; return; }
  try {
    const count = Number(await contract.requestCount()), batchSize = 100;
    requests = [];
    for (let offset = 0; offset < count; offset += batchSize) {
      const batch = await contract.getRequests(offset, Math.min(batchSize, count - offset));
      requests.push(...batch.map((r) => ({
        id: Number(r.id), requester: r.requester, title: r.title, description: r.description,
        status: Number(r.status), createdAt: Number(r.createdAt), updatedAt: Number(r.updatedAt)
      })));
    }
    $("totalCount").textContent = count;
    $("openCount").textContent = requests.filter(r => r.status === 0).length;
    $("progressCount").textContent = requests.filter(r => r.status === 1).length;
    $("resolvedCount").textContent = requests.filter(r => r.status === 2).length;
    $("requestCountLabel").textContent = `${requests.length} request${requests.length === 1 ? "" : "s"}`;
    renderRequests();
  } catch (error) { message(error?.shortMessage || error?.message || "Could not load requests. Check network and contract address.", "error"); }
}
function renderRequests() {
  const filter = $("statusFilter").value;
  const visible = requests.filter(r => filter === "all" || r.status === Number(filter));
  const list = $("requestList");
  if (!visible.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⌁</div><h3>No requests found</h3><p>Try another status filter or submit a new maintenance report.</p></div>`;
    return;
  }
  list.innerHTML = visible.map((r) => {
    const controls = activeAccount.toLowerCase() === ownerAccount.toLowerCase()
      ? `<div class="owner-controls"><label class="sr-only" for="status-${r.id}">New status for request ${r.id}</label>
         <select id="status-${r.id}">${STATUS.map((s, i) => `<option value="${i}" ${i === r.status ? "selected" : ""}>${s}</option>`).join("")}</select>
         <button class="button button-outline" data-update="${r.id}">Update status</button></div>` : "";
    return `<article class="request-card">
      <div class="request-top"><div><div class="request-id">REQUEST #${r.id}</div><h3>${safeText(r.title)}</h3></div><span class="status status-${r.status}">${statusName(r.status)}</span></div>
      <div class="request-description">${safeText(r.description)}</div>
      <div class="request-meta"><span>Submitted by ${safeText(shortAddress(r.requester))}</span><span>${safeText(formatDate(r.createdAt))}</span></div>
      ${controls}
    </article>`;
  }).join("");
  list.querySelectorAll("[data-update]").forEach(button => button.addEventListener("click", () => updateStatus(Number(button.dataset.update), button)));
}
async function submitRequest(event) {
  event.preventDefault();
  if (!contract) { message("Connect MetaMask and configure the deployed contract address first.", "error"); return; }
  const title = $("requestTitle").value.trim(), description = $("requestDescription").value.trim();
  if (!title || !description) return message("Both title and description are required.", "error");
  if (ethers.toUtf8Bytes(title).length > 80) return message("Title must be no more than 80 UTF-8 bytes.", "error");
  if (ethers.toUtf8Bytes(description).length > 500) return message("Description must be no more than 500 UTF-8 bytes.", "error");
  const button = $("submitButton"); setBusy(button, true, "Confirm in MetaMask…");
  try {
    const tx = await contract.createRequest(title, description);
    message("Transaction submitted. Waiting for blockchain confirmation…");
    await tx.wait(); $("requestForm").reset(); updateLengths();
    message("Request submitted successfully."); await loadRequests(); toast("Maintenance request created");
  } catch (error) { message(error?.shortMessage || error?.reason || error?.message || "Transaction failed.", "error"); }
  finally { setBusy(button, false); }
}
async function updateStatus(id, button) {
  const nextStatus = Number($(`status-${id}`).value), current = requests.find(r => r.id === id);
  if (!current || nextStatus === current.status) return toast("Choose a different status first.");
  setBusy(button, true, "Waiting…");
  try {
    const tx = await contract.updateStatus(id, nextStatus); toast("Confirm status update in MetaMask");
    await tx.wait(); await loadRequests(); toast(`Request #${id} marked ${statusName(nextStatus)}`);
  } catch (error) { message(error?.shortMessage || error?.reason || error?.message || "Status update failed.", "error"); }
  finally { setBusy(button, false); }
}
function updateLengths() {
  $("titleLength").textContent = `${ethers.toUtf8Bytes($("requestTitle").value).length} / 80 bytes`;
  $("descriptionLength").textContent = `${ethers.toUtf8Bytes($("requestDescription").value).length} / 500 bytes`;
}
$("connectButton").addEventListener("click", connectWallet);
$("refreshButton").addEventListener("click", loadRequests);
$("requestForm").addEventListener("submit", submitRequest);
$("statusFilter").addEventListener("change", renderRequests);
$("requestTitle").addEventListener("input", updateLengths);
$("requestDescription").addEventListener("input", updateLengths);
if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", () => window.location.reload());
  window.ethereum.on?.("chainChanged", () => window.location.reload());
}
updateLengths();
