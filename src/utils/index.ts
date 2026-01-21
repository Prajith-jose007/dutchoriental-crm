


export function createPageUrl(pageName: string) {
    if (pageName === 'Dashboard') return '/';
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}