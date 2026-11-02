import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

void main() {
  testWidgets('shell frame renders the five contract tabs', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: SdkworkAgentsAppShellFrame(
          tabs: agentsMobileTabs,
          destinations: const <Widget>[
            Center(child: Text('chat')),
            Center(child: Text('inspiration')),
            Center(child: Text('creative')),
            Center(child: Text('assets')),
            Center(child: Text('agents')),
          ],
          currentIndex: 0,
          onSelectTab: (_) {},
          translate: createSdkworkAgentsShellTranslator('en-US'),
        ),
      ),
    );

    expect(find.text('Chat'), findsOneWidget);
    expect(find.text('Inspiration'), findsOneWidget);
    expect(find.text('Create'), findsOneWidget);
    expect(find.text('Assets'), findsOneWidget);
    expect(find.text('Agent'), findsOneWidget);
    expect(find.text('chat'), findsOneWidget);
  });

  testWidgets('shell frame reports the selected destination', (
    WidgetTester tester,
  ) async {
    var selected = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: StatefulBuilder(
          builder: (BuildContext context, StateSetter setState) {
            return SdkworkAgentsAppShellFrame(
              tabs: agentsMobileTabs,
              destinations: const <Widget>[
                Center(child: Text('chat')),
                Center(child: Text('inspiration')),
                Center(child: Text('creative')),
                Center(child: Text('assets')),
                Center(child: Text('agents')),
              ],
              currentIndex: selected,
              onSelectTab: (int index) => setState(() => selected = index),
              translate: createSdkworkAgentsShellTranslator('en-US'),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('Assets'));
    await tester.pumpAndSettle();
    expect(selected, 3);
    expect(find.text('assets'), findsOneWidget);
  });
}
