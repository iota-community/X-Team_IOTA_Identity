<script>
  console.log("hello create!!!");
  import * as identity from "iota-identity-wasm-test/web/";
  import { writable } from "svelte/store";

  let state = { loading: false };
  let alice_keypair = {};
  let alice_did = {};
  let alice_doc = {};
  let result = false;

  const IOTA_CLIENT_CONFIG = {
    network: "main",
    node: "https://nodes.thetangle.org:443"
  };

  async function create_did() {
    state.loading = !state.loading;
    await identity.init();
    console.log(identity);

    // Generate Keypairs
    alice_keypair = identity.Key.generateEd25519("main");
    console.log("alice_keypair: ", alice_keypair);

    // Create the DID
    alice_did = new identity.DID(alice_keypair, "main");
    console.log("alice_did: ", alice_did);

    // Create the DID Document
    alice_doc = new identity.Doc(
      identity.PubKey.generateEd25519(alice_did, alice_keypair.public)
    );
    console.log("alice_doc: ", alice_doc);

    console.log("sending...");
  }

  async function publish() {
    console.log("Publishing to the tangle...");
    console.log(alice_did);
    console.log("alice_doc: ", alice_doc);

    // Sign all DID documents
    alice_doc.sign(alice_keypair);

    console.log("Signed Doc: ", alice_doc.verify());
    // Publish the DID document
    result = await identity.publish(alice_doc.toJSON(), IOTA_CLIENT_CONFIG);
    console.log(
      "Publish Result: https://explorer.iota.org/mainnet/transaction/" + result
    );
  }

  let _user = {
    key: alice_keypair,
    did: alice_did,
    doc: alice_doc
  }

  const store = writable(localStorage.setItem("user", JSON.stringify(_user)));

  export const user = writable(_user);
</script>

<style>

</style>

<svelte:options tag="create-did" />
<div>
  {#if !state.loading}
    <button on:click={create_did}>Create DID</button>
  {/if}

  {#if state.loading}
    <p>alice_keypair:</p>
    <pre>{alice_keypair}</pre>
    <p>alice_did:</p>
    <pre>{alice_did}</pre>
    <p>alice_doc:</p>
    <pre>{alice_doc}</pre>

    {#if !result}
      <button on:click={publish}>Publish DIDDoc</button>
    {/if}
    {#if result}
      <p>Document Published!</p>
      <pre>{result}</pre>
    {/if}
  {/if}

</div>
