/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/
import * as React from 'react';
import 'react-dom';
import { Devfile, TemplateProjectIdentifier } from '../../common/devfile';
import { DevfileSearch } from '../../common/devfileSearch';
import { SetNameAndFolder } from '../../common/setNameAndFolder';

type CurrentPage = 'selectTemplateProject' | 'setNameAndFolder';

type FromTemplateProjectProps = {
    goHome: () => void;
};

export function FromTemplateProject(props: FromTemplateProjectProps) {
    const [currentPage, setCurrentPage] = React.useState<CurrentPage>('selectTemplateProject');
    const [selectedTemplateProject, setSelectedTemplateProject] =
        React.useState<TemplateProjectIdentifier>(undefined);
    const [selectedDevfile, setSelectedDevfile] = React.useState<Devfile>(undefined);

    function setSelectedProjectAndAdvance(value: TemplateProjectIdentifier) {
        setSelectedTemplateProject((_) => value);
        setCurrentPage((_) => 'setNameAndFolder');
    }

    function createComponentFromTemplateProject(projectFolder: string, componentName: string) {
        window['vscodeApi'].postMessage({
            action: 'createComponentFromTemplateProject',
            data: {
                templateProject: selectedTemplateProject,
                projectFolder,
                componentName,
            },
        });
    }

    switch (currentPage) {
        case 'selectTemplateProject':
            return (
                <DevfileSearch
                    setSelectedDevfile={setSelectedDevfile}
                    setSelectedTemplateProject={setSelectedProjectAndAdvance}
                    titleText="Select Template Project from Devfile"
                    goBack={props.goHome}
                />
            );
        case 'setNameAndFolder':
            return (
                <SetNameAndFolder
                    goBack={() => {
                        setCurrentPage('selectTemplateProject');
                    }}
                    createComponent={createComponentFromTemplateProject}
                    devfile={selectedDevfile}
                    templateProject={selectedTemplateProject.templateProjectName}
                />
            );
    }
}