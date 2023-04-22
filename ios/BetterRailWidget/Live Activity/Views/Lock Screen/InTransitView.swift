import SwiftUI
import Foundation
import WidgetKit
import ActivityKit

struct LockScreenInTransitView: View {
  var vm: ActivityViewModel
  
  var body: some View {
    VStack(alignment: .leading) {
      ActivityHeaderStatus(vm: vm, stationName: vm.destination.name)
      
      HStack(alignment: .bottom) {
        VStack(alignment: .leading) {
          if (vm.status == .arrived) {
            Text("arrived at").font(.caption).padding(.bottom, 2.0)
          } else {
            Text("next station").font(.caption)
          }
          Text(vm.nextStop.name).fontWeight(.heavy).fontWidth(Font.Width(0.1))
        }
        
        Spacer()
        
        TimeInformation(vm: vm)
      }

      RideInformationBar(vm: vm)
    }
  }
}

