<svelte:options tag="create-did-demo" />

<script lang="ts">
  console.log("hello !!!");
  import * as identity from "iota-identity-wasm-test/web/";

  let state = { loading: false };
  let alice_keypair = { };
  let alice_did = { };
  let alice_doc = { };

  async function send() {
    state.loading = !state.loading;
    await identity.init();
    console.log(identity);

    // Generate Keypairs
    alice_keypair = identity.Key.generateEd25519("main")
    console.log("alice_keypair: ", alice_keypair)

    // Create the DID
    alice_did = new identity.DID(alice_keypair, "main")
    console.log("alice_did: ", alice_did)

    // Create the DID Document
    alice_doc = new identity.Doc(identity.PubKey.generateEd25519(alice_did, alice_keypair.public))
    console.log("alice_doc: ", alice_doc)

    console.log("sending...");

  }
</script>

<style>

</style>

<div>
  {#if !state.loading}
    <button on:click={send}>Create DID</button>
  {/if}

  {#if state.loading}
    <p>alice_keypair:</p>
    <pre> { alice_keypair }</pre>
    <p>alice_did:</p>
    <pre> { alice_did }</pre>
    <p>alice_doc:</p>
    <pre> { alice_doc }</pre>
  {/if}
</div>
