import SwiftUI


struct RoutesView: View {
  @ObservedObject var route: RouteViewModel
  
    var body: some View {
      ScrollViewReader { proxy in
        VStack {
          HStack {
            Text("departure").foregroundColor(Color.gray)
            Spacer()
            Text("arrival").foregroundColor(Color.gray)
          }.font(Font.custom("Heebo", size: 16))
          
          if (route.loading) {
            ProgressView().progressViewStyle(CircularProgressViewStyle())
          }
          else if let requestError = route.error {
            InfoMessage(imageName: "wifi.exclamationmark", message: requestError.localizedDescription)
          } else if (route.trains.count == 0) {
            InfoMessage(imageName: "tram", message: String(localized: "no-trains-found"))
          } else {
            List (0 ..< route.trains.count, id: \.self) { index in
              // TODO: Refactor train property names - too confusing!
              let trainDetails = route.trains[index]
              let trainDetailsView = TrainDetailsView(trainRoute: trainDetails)
              
              NavigationLink(destination: trainDetailsView) {
                HStack {
                  Text(formatRouteHour(trainDetails.departureTime))
                  Spacer()
                  Image(systemName: "arrow.forward")
                  Spacer()
                  Text(formatRouteHour(trainDetails.arrivalTime))
                }
              }
              .id(index)
            }
            .listStyle(CarouselListStyle()).environment(\.defaultMinListRowHeight, 50)
            .onReceive(route.$closestIndexToDate, perform: { index in
              if let index = index {
                proxy.scrollTo(index, anchor: .top)
              }
            })
          }
        }
        .onAppear {
          route.shouldRefetchRoutes()
        }
      }
    }
}

struct InfoMessage: View {
  var imageName: String
  var message: String
  
  var body: some View {
    VStack(alignment: .center) {
      Spacer()
      Image(systemName: imageName).padding(.vertical, 2.0).font(.system(size: 24))
      Text(message).font(Font.custom("Heebo", size: 14)).multilineTextAlignment(.center)
      Spacer()
    }
  }
}
//
//struct RoutesView_Previews: PreviewProvider {
//    static var previews: some View {
//      RoutesView(route: RouteViewModel(origin: stations[0], destination: stations[1]))
//    }
//}
