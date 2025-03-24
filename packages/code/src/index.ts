import { Workflow } from './workflow'

// Main function that will be executed when the package is run
async function main() {
  const workflow = new Workflow()
  await workflow.run()
}

// Run the main function immediately when imported
main().catch((error) => {
  console.error('Error running i18n-translator:', error)
  process.exit(1)
})
