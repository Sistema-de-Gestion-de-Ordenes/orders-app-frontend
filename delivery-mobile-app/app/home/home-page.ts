/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/
import { NavigatedData, Page, Frame } from '@nativescript/core'
import { HomeViewModel } from './home-view-model'

export function onNavigatingTo(args: NavigatedData) {
  const page = <Page>args.object
  page.bindingContext = new HomeViewModel()
}

export function onGoToClientes() {
  Frame.topmost().navigate({ moduleName: 'clients/create-client-page' })
}

export function onGoToEntregas() {}
export function onGoToRepartidores() {}
export function onGoToPerfil() {}